import { Router, type IRouter, type Request, type Response } from 'express';
import { requireAuth } from '../middleware/authz.js';
import { getNote } from '../services/note-builder.js';
import { getSession } from '../repositories/session-repo.js';
import { recordEvent, listEvents } from '../services/audit-log.js';

const exportRouter: IRouter = Router();

// Clipboard / JSON export for a note
exportRouter.get('/:noteId/export/json', requireAuth, (req: Request, res: Response) => {
  const note = getNote(String(req.params.noteId));
  if (!note) {
    res.status(404).json({ error: 'Note not found' });
    return;
  }
  recordEvent(
    'note.exported',
    'session',
    note.sessionId,
    req.user!.userId,
    req.user!.organizationId,
    { format: 'json', noteId: note.id },
  );
  res.json({ format: 'json', note });
});

// Plain-text export (clipboard-friendly)
exportRouter.get('/:noteId/export/text', requireAuth, (req: Request, res: Response) => {
  const note = getNote(String(req.params.noteId));
  if (!note) {
    res.status(404).json({ error: 'Note not found' });
    return;
  }
  const text = note.blocks.map((b) => b.content).join('\n\n');
  recordEvent(
    'note.exported',
    'session',
    note.sessionId,
    req.user!.userId,
    req.user!.organizationId,
    { format: 'text', noteId: note.id },
  );
  res.type('text/plain').send(text);
});

// PDF stub — returns metadata for now, real PDF generation deferred
exportRouter.get('/:noteId/export/pdf', requireAuth, (req: Request, res: Response) => {
  const note = getNote(String(req.params.noteId));
  if (!note) {
    res.status(404).json({ error: 'Note not found' });
    return;
  }
  recordEvent(
    'note.exported',
    'session',
    note.sessionId,
    req.user!.userId,
    req.user!.organizationId,
    { format: 'pdf', noteId: note.id },
  );
  res.json({
    format: 'pdf',
    status: 'stub',
    message: 'PDF generation available in Phase B',
    noteId: note.id,
  });
});

// Audit trail for a session
exportRouter.get('/sessions/:sessionId/audit', requireAuth, (req: Request, res: Response) => {
  const session = getSession(String(req.params.sessionId));
  if (!session) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }
  if (session.organizationId !== req.user!.organizationId) {
    res.status(403).json({ error: 'Access denied' });
    return;
  }
  // Return audit events for this session (from the audit-log service)
  const events = listEvents({ entityId: session.id });
  res.json({ sessionId: session.id, events });
});

export { exportRouter };
