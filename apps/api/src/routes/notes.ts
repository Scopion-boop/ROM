import { Router, Request, Response } from 'express';
import type { IRouter } from 'express';
import { requireAuth } from '../middleware/authz';
import { getRepos } from '../repositories/repo-factory';
import { generateNote, type MeasurementInput } from '../services/note-builder';

export const noteRouter: IRouter = Router();

noteRouter.use(requireAuth);

/**
 * POST /api/sessions/:sessionId/notes/generate — generate a draft note from measurements.
 */
noteRouter.post('/:sessionId/notes/generate', async (req: Request, res: Response): Promise<void> => {
    const { sessions, measurements, notes } = getRepos();
    const session = await sessions.getById(String(req.params.sessionId));
    if (!session || session.organizationId !== req.user!.organizationId) {
        res.status(404).json({ error: 'Session not found' });
        return;
    }

    const mList = await measurements.listBySession(session.id);
    if (mList.length === 0) {
        res.status(400).json({ error: 'No measurements found for this session' });
        return;
    }

    const note = generateNote(session.id, mList as MeasurementInput[]);
    await notes.save(note);

    res.status(201).json(note);
});

/**
 * GET /api/sessions/:sessionId/notes — list notes for a session.
 */
noteRouter.get('/:sessionId/notes', async (req: Request, res: Response): Promise<void> => {
    const { sessions, notes } = getRepos();
    const session = await sessions.getById(String(req.params.sessionId));
    if (!session || session.organizationId !== req.user!.organizationId) {
        res.status(404).json({ error: 'Session not found' });
        return;
    }

    res.json(await notes.listBySession(session.id));
});

/**
 * PATCH /api/notes/:noteId/blocks — update note blocks (clinician edits).
 */
noteRouter.patch('/notes/:noteId/blocks', async (req: Request, res: Response): Promise<void> => {
    const { blocks } = req.body;
    if (!blocks || !Array.isArray(blocks) || blocks.length === 0) {
        res.status(400).json({ error: 'blocks array is required' });
        return;
    }

    const updated = await getRepos().notes.updateBlocks(String(req.params.noteId), blocks);
    if (!updated) {
        res.status(404).json({ error: 'Note not found' });
        return;
    }
    res.json(updated);
});

/**
 * PATCH /api/notes/:noteId/status — transition note status.
 */
noteRouter.patch('/notes/:noteId/status', async (req: Request, res: Response): Promise<void> => {
    const { status } = req.body;
    if (!status) {
        res.status(400).json({ error: 'status is required' });
        return;
    }

    const updated = await getRepos().notes.updateStatus(String(req.params.noteId), status);
    if (!updated) {
        res.status(404).json({ error: 'Note not found' });
        return;
    }
    res.json(updated);
});
