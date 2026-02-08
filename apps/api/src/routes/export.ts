import { Router, type IRouter, type Request, type Response } from 'express';
import { requireAuth } from '../middleware/authz.js';
import { getRepos } from '../repositories/repo-factory';

const exportRouter: IRouter = Router();

// Clipboard / JSON export for a note
exportRouter.get('/:noteId/export/json', requireAuth, async (req: Request, res: Response) => {
    const { notes, audit } = getRepos();
    const note = await notes.getById(String(req.params.noteId));
    if (!note) {
        res.status(404).json({ error: 'Note not found' });
        return;
    }
    await audit.record({
        eventType: 'note.exported',
        entityType: 'session',
        entityId: note.sessionId,
        actorId: req.user!.userId,
        organizationId: req.user!.organizationId,
        metadata: { format: 'json', noteId: note.id },
    });
    res.json({ format: 'json', note });
});

// Plain-text export (clipboard-friendly)
exportRouter.get('/:noteId/export/text', requireAuth, async (req: Request, res: Response) => {
    const { notes, audit } = getRepos();
    const note = await notes.getById(String(req.params.noteId));
    if (!note) {
        res.status(404).json({ error: 'Note not found' });
        return;
    }
    const text = note.blocks.map((b) => b.content).join('\n\n');
    await audit.record({
        eventType: 'note.exported',
        entityType: 'session',
        entityId: note.sessionId,
        actorId: req.user!.userId,
        organizationId: req.user!.organizationId,
        metadata: { format: 'text', noteId: note.id },
    });
    res.type('text/plain').send(text);
});

// PDF stub — returns metadata for now, real PDF generation deferred
exportRouter.get('/:noteId/export/pdf', requireAuth, async (req: Request, res: Response) => {
    const { notes, audit } = getRepos();
    const note = await notes.getById(String(req.params.noteId));
    if (!note) {
        res.status(404).json({ error: 'Note not found' });
        return;
    }
    await audit.record({
        eventType: 'note.exported',
        entityType: 'session',
        entityId: note.sessionId,
        actorId: req.user!.userId,
        organizationId: req.user!.organizationId,
        metadata: { format: 'pdf', noteId: note.id },
    });
    res.json({
        format: 'pdf',
        status: 'stub',
        message: 'PDF generation available in Phase B',
        noteId: note.id,
    });
});

// Audit trail for a session
exportRouter.get('/sessions/:sessionId/audit', requireAuth, async (req: Request, res: Response) => {
    const { sessions, audit } = getRepos();
    const session = await sessions.getById(String(req.params.sessionId));
    if (!session) {
        res.status(404).json({ error: 'Session not found' });
        return;
    }
    if (session.organizationId !== req.user!.organizationId) {
        res.status(403).json({ error: 'Access denied' });
        return;
    }
    const events = await audit.list({ entityId: session.id });
    // Map actorId → userId and metadata → details for API compat
    const mapped = events.map((e) => ({
        ...e,
        userId: e.actorId,
        details: e.metadata,
    }));
    res.json({ sessionId: session.id, events: mapped });
});

export { exportRouter };
