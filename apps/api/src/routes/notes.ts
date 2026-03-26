import { Router, Request, Response } from 'express';
import type { IRouter } from 'express';
import { requireAuth } from '../middleware/authz';
import { validateBody, validateParams } from '../middleware/validation';
import { getRepos } from '../repositories/repo-factory';
import {
  sessionIdParamSchema,
  noteIdParamSchema,
  updateNoteBlocksSchema,
  updateNoteStatusSchema,
} from '../schemas/api-schemas';
import { generateNote, type MeasurementInput } from '../services/note-builder';

export const noteRouter: IRouter = Router();

noteRouter.use(requireAuth);

/**
 * POST /api/sessions/:sessionId/notes/generate — generate a draft note from measurements.
 */
noteRouter.post(
  '/:sessionId/notes/generate',
  validateParams(sessionIdParamSchema),
  async (req: Request, res: Response): Promise<void> => {
    const { sessions, measurements, notes, audit } = getRepos();
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

    // Audit log: clinical note generated (PHI documentation)
    await audit.record({
      eventType: 'note.generated',
      entityType: 'note',
      entityId: note.id,
      actorId: req.user!.userId,
      organizationId: req.user!.organizationId,
      metadata: {
        sessionId: session.id,
        measurementCount: mList.length,
        status: note.status,
      },
    });

    res.status(201).json(note);
  },
);

/**
 * GET /api/sessions/:sessionId/notes — list notes for a session.
 */
noteRouter.get(
  '/:sessionId/notes',
  validateParams(sessionIdParamSchema),
  async (req: Request, res: Response): Promise<void> => {
    const { sessions, notes } = getRepos();
    const session = await sessions.getById(String(req.params.sessionId));
    if (!session || session.organizationId !== req.user!.organizationId) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    res.json(await notes.listBySession(session.id));
  },
);

/**
 * PATCH /api/notes/:noteId/blocks — update note blocks (clinician edits).
 */
noteRouter.patch(
  '/notes/:noteId/blocks',
  validateParams(noteIdParamSchema),
  validateBody(updateNoteBlocksSchema),
  async (req: Request, res: Response): Promise<void> => {
    const { blocks } = req.body;

    const { notes, sessions, audit } = getRepos();
    const note = await notes.getById(String(req.params.noteId));
    if (!note) {
      res.status(404).json({ error: 'Note not found' });
      return;
    }

    // Org-scoped authorization check
    const session = await sessions.getById(note.sessionId);
    if (!session || session.organizationId !== req.user!.organizationId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const updated = await notes.updateBlocks(String(req.params.noteId), blocks);
    if (!updated) {
      res.status(404).json({ error: 'Note not found' });
      return;
    }

    // Audit log: clinician edited note (PHI modification)
    await audit.record({
      eventType: 'note.edited',
      entityType: 'note',
      entityId: updated.id,
      actorId: req.user!.userId,
      organizationId: req.user!.organizationId,
      metadata: {
        sessionId: updated.sessionId,
        blockCount: blocks.length,
      },
    });

    res.json(updated);
  },
);

/**
 * PATCH /api/notes/:noteId/status — transition note status.
 */
noteRouter.patch(
  '/notes/:noteId/status',
  validateParams(noteIdParamSchema),
  validateBody(updateNoteStatusSchema),
  async (req: Request, res: Response): Promise<void> => {
    const { status } = req.body;

    const { notes, sessions, audit } = getRepos();
    const note = await notes.getById(String(req.params.noteId));
    if (!note) {
      res.status(404).json({ error: 'Note not found' });
      return;
    }

    // Org-scoped authorization check
    const session = await sessions.getById(note.sessionId);
    if (!session || session.organizationId !== req.user!.organizationId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const previousStatus = note.status;
    const updated = await notes.updateStatus(String(req.params.noteId), status);
    if (!updated) {
      res.status(404).json({ error: 'Note not found' });
      return;
    }

    // Audit log: note status changed (especially approval/finalization)
    const eventType =
      status === 'finalized' || status === 'reviewed' ? 'note.approved' : 'note.status_updated';

    await audit.record({
      eventType,
      entityType: 'note',
      entityId: updated.id,
      actorId: req.user!.userId,
      organizationId: req.user!.organizationId,
      metadata: {
        sessionId: updated.sessionId,
        previousStatus,
        newStatus: status,
      },
    });

    res.json(updated);
  },
);
