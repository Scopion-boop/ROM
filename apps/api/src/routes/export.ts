import { Router, type IRouter, type Request, type Response } from 'express';
import PDFDocument from 'pdfkit';
import { requireAuth } from '../middleware/authz.js';
import { validateParams, validateQuery } from '../middleware/validation';
import { getRepos } from '../repositories/repo-factory';
import { noteIdParamSchema, sessionIdParamSchema, auditQuerySchema } from '../schemas/api-schemas';

const exportRouter: IRouter = Router();

// Clipboard / JSON export for a note
exportRouter.get(
  '/:noteId/export/json',
  requireAuth,
  validateParams(noteIdParamSchema),
  async (req: Request, res: Response) => {
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
    await audit.record({
      eventType: 'note.exported',
      entityType: 'session',
      entityId: note.sessionId,
      actorId: req.user!.userId,
      organizationId: req.user!.organizationId,
      metadata: { format: 'json', noteId: note.id },
    });
    res.json({ format: 'json', note });
  },
);

// Plain-text export (clipboard-friendly)
exportRouter.get(
  '/:noteId/export/text',
  requireAuth,
  validateParams(noteIdParamSchema),
  async (req: Request, res: Response) => {
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
  },
);

// PDF export — generates a clinical ROM report
exportRouter.get(
  '/:noteId/export/pdf',
  requireAuth,
  validateParams(noteIdParamSchema),
  async (req: Request, res: Response) => {
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

    // Audit log the export
    await audit.record({
      eventType: 'note.exported',
      entityType: 'session',
      entityId: note.sessionId,
      actorId: req.user!.userId,
      organizationId: req.user!.organizationId,
      metadata: { format: 'pdf', noteId: note.id },
    });

    // Build PDF into a buffer so we can set Content-Length
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 60, bottom: 60, left: 60, right: 60 },
      info: {
        Title: 'PhysioLens Clinical ROM Report',
        Author: 'PhysioLens',
        Subject: `Session ${session.id}`,
      },
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));

    const pdfReady = new Promise<Buffer>((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
    });

    // ── Header ──────────────────────────────────────────────────
    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

    doc
      .fontSize(22)
      .font('Helvetica-Bold')
      .text('PhysioLens Clinical ROM Report', { align: 'center' });
    doc.moveDown(0.3);

    // Accent rule
    const ruleY = doc.y;
    doc
      .moveTo(doc.page.margins.left, ruleY)
      .lineTo(doc.page.margins.left + pageWidth, ruleY)
      .strokeColor('#2563eb')
      .lineWidth(2)
      .stroke();
    doc.moveDown(0.8);

    // ── Patient / Session Info ──────────────────────────────────
    doc.fontSize(10).font('Helvetica').fillColor('#555555');
    const sessionDate = session.createdAt
      ? new Date(session.createdAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : 'N/A';
    doc.text(`Session ID:  ${session.id}`);
    doc.text(`Date:        ${sessionDate}`);
    doc.text(`Status:      ${session.status}`);
    if (session.joints?.length) {
      doc.text(`Joints:      ${session.joints.join(', ')}`);
    }
    doc.text(`Note ID:     ${note.id}`);
    doc.text(`Note Status: ${note.status}`);
    doc.moveDown(1);

    // Thin separator
    const sep1Y = doc.y;
    doc
      .moveTo(doc.page.margins.left, sep1Y)
      .lineTo(doc.page.margins.left + pageWidth, sep1Y)
      .strokeColor('#d1d5db')
      .lineWidth(0.5)
      .stroke();
    doc.moveDown(0.6);

    // ── Note Blocks ─────────────────────────────────────────────
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .fillColor('#111111')
      .text('Examination Findings', { underline: false });
    doc.moveDown(0.5);

    if (note.blocks.length === 0) {
      doc
        .fontSize(11)
        .font('Helvetica')
        .fillColor('#666666')
        .text('No examination blocks recorded.');
    } else {
      note.blocks.forEach((block, idx) => {
        // Section header
        const label = block.type
          ? block.type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
          : `Section ${idx + 1}`;

        doc
          .fontSize(12)
          .font('Helvetica-Bold')
          .fillColor('#1e3a5f')
          .text(`${idx + 1}. ${label}`);
        doc.moveDown(0.2);

        // Block content
        doc
          .fontSize(11)
          .font('Helvetica')
          .fillColor('#333333')
          .text(block.content || '(no content)', {
            width: pageWidth,
            lineGap: 3,
          });
        doc.moveDown(0.6);

        // Light divider between blocks (skip after last)
        if (idx < note.blocks.length - 1) {
          const divY = doc.y;
          doc
            .moveTo(doc.page.margins.left, divY)
            .lineTo(doc.page.margins.left + pageWidth * 0.4, divY)
            .strokeColor('#e5e7eb')
            .lineWidth(0.5)
            .stroke();
          doc.moveDown(0.5);
        }
      });
    }

    // ── Footer ──────────────────────────────────────────────────
    doc.moveDown(1.5);
    const footY = doc.y;
    doc
      .moveTo(doc.page.margins.left, footY)
      .lineTo(doc.page.margins.left + pageWidth, footY)
      .strokeColor('#d1d5db')
      .lineWidth(0.5)
      .stroke();
    doc.moveDown(0.4);

    const exportTimestamp = new Date().toISOString();
    doc
      .fontSize(8)
      .font('Helvetica')
      .fillColor('#999999')
      .text(
        `Generated by PhysioLens on ${exportTimestamp}. This document is for clinical reference only.`,
        { align: 'center' },
      );

    doc.end();

    // Wait for PDF to finish, then send
    const pdfBuffer = await pdfReady;
    const filename = `physiolens-rom-report-${note.id.slice(0, 8)}.pdf`;

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': String(pdfBuffer.length),
    });
    res.send(pdfBuffer);
  },
);

// Audit trail for a session
exportRouter.get(
  '/sessions/:sessionId/audit',
  requireAuth,
  validateParams(sessionIdParamSchema),
  validateQuery(auditQuerySchema),
  async (req: Request, res: Response) => {
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
  },
);

export { exportRouter };
