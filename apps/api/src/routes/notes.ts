import { Router, Request, Response } from 'express';
import type { IRouter } from 'express';
import { requireAuth } from '../middleware/authz';
import { getSession } from '../repositories/session-repo';
import { listMeasurementsBySession } from '../repositories/measurement-repo';
import {
    generateNote,
    saveNote,
    listNotesBySession,
    updateNoteBlocks,
    updateNoteStatus,
} from '../services/note-builder';

export const noteRouter: IRouter = Router();

noteRouter.use(requireAuth);

/**
 * POST /api/sessions/:sessionId/notes/generate — generate a draft note from measurements.
 */
noteRouter.post('/:sessionId/notes/generate', (req: Request, res: Response): void => {
    const session = getSession(String(req.params.sessionId));
    if (!session || session.organizationId !== req.user!.organizationId) {
        res.status(404).json({ error: 'Session not found' });
        return;
    }

    const measurements = listMeasurementsBySession(session.id);
    if (measurements.length === 0) {
        res.status(400).json({ error: 'No measurements found for this session' });
        return;
    }

    const note = generateNote(session.id, measurements);
    saveNote(note);

    res.status(201).json(note);
});

/**
 * GET /api/sessions/:sessionId/notes — list notes for a session.
 */
noteRouter.get('/:sessionId/notes', (req: Request, res: Response): void => {
    const session = getSession(String(req.params.sessionId));
    if (!session || session.organizationId !== req.user!.organizationId) {
        res.status(404).json({ error: 'Session not found' });
        return;
    }

    res.json(listNotesBySession(session.id));
});

/**
 * PATCH /api/notes/:noteId/blocks — update note blocks (clinician edits).
 */
noteRouter.patch('/notes/:noteId/blocks', (req: Request, res: Response): void => {
    const { blocks } = req.body;
    if (!blocks || !Array.isArray(blocks) || blocks.length === 0) {
        res.status(400).json({ error: 'blocks array is required' });
        return;
    }

    const updated = updateNoteBlocks(String(req.params.noteId), blocks);
    if (!updated) {
        res.status(404).json({ error: 'Note not found' });
        return;
    }
    res.json(updated);
});

/**
 * PATCH /api/notes/:noteId/status — transition note status.
 */
noteRouter.patch('/notes/:noteId/status', (req: Request, res: Response): void => {
    const { status } = req.body;
    if (!status) {
        res.status(400).json({ error: 'status is required' });
        return;
    }

    const updated = updateNoteStatus(String(req.params.noteId), status);
    if (!updated) {
        res.status(404).json({ error: 'Note not found' });
        return;
    }
    res.json(updated);
});
