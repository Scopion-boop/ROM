import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../app';
import { _clearSessions } from '../../repositories/session-repo';
import { _clearMeasurements } from '../../repositories/measurement-repo';
import { _clearNotes } from '../../services/note-builder';
import { _clearAuditLog } from '../../services/audit-log';

const TEST_USER = {
    email: `export-test-${Date.now()}@test.com`,
    password: 'P@ssw0rd!',
    organizationId: 'org-export-001',
    role: 'clinician',
};

async function getToken(): Promise<string> {
    const res = await request(app).post('/api/auth/register').send(TEST_USER);
    return res.body.token;
}

describe('Export & Audit APIs', () => {
    let token: string;

    beforeEach(async () => {
        _clearSessions();
        _clearMeasurements();
        _clearNotes();
        _clearAuditLog();
        TEST_USER.email = `export-test-${Date.now()}@test.com`;
        token = await getToken();
    });

    async function createTestSessionAndNote() {
        // Create a session
        const sessionRes = await request(app)
            .post('/api/sessions')
            .set('Authorization', `Bearer ${token}`)
            .send({ joints: ['right_shoulder'], patientId: 'pat-001' });
        const sessionId = sessionRes.body.id;

        // Create a measurement
        await request(app)
            .post(`/api/sessions/${sessionId}/measurements`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                joint: 'shoulder',
                movement: 'flexion',
                side: 'right',
                romDegrees: 155,
                confidenceScore: 0.93,
                qualityFlags: [],
            });

        // Generate a note
        const noteRes = await request(app)
            .post(`/api/sessions/${sessionId}/notes/generate`)
            .set('Authorization', `Bearer ${token}`)
            .send();

        return { sessionId, noteId: noteRes.body.id };
    }

    // ── JSON Export ──────────────────────────────────────────────
    it('exports a note as JSON', async () => {
        const { noteId } = await createTestSessionAndNote();
        const res = await request(app)
            .get(`/api/notes/${noteId}/export/json`)
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(res.body.format).toBe('json');
        expect(res.body.note).toBeDefined();
        expect(res.body.note.id).toBe(noteId);
    });

    // ── Text Export ──────────────────────────────────────────────
    it('exports a note as plain text', async () => {
        const { noteId } = await createTestSessionAndNote();
        const res = await request(app)
            .get(`/api/notes/${noteId}/export/text`)
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(res.headers['content-type']).toContain('text/plain');
        expect(res.text).toContain('ROM Examination');
    });

    // ── PDF Stub ─────────────────────────────────────────────────
    it('returns PDF stub for a note', async () => {
        const { noteId } = await createTestSessionAndNote();
        const res = await request(app)
            .get(`/api/notes/${noteId}/export/pdf`)
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(res.body.format).toBe('pdf');
        expect(res.body.status).toBe('stub');
    });

    // ── 404 on missing note ──────────────────────────────────────
    it('returns 404 for non-existent note export', async () => {
        const res = await request(app)
            .get('/api/notes/fake-note-id/export/json')
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(404);
    });

    // ── Audit trail for session ──────────────────────────────────
    it('records audit events on export', async () => {
        const { sessionId, noteId } = await createTestSessionAndNote();

        // Export to generate an audit event
        await request(app)
            .get(`/api/notes/${noteId}/export/json`)
            .set('Authorization', `Bearer ${token}`);

        const res = await request(app)
            .get(`/api/sessions/${sessionId}/audit`)
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(res.body.events).toBeDefined();
        expect(res.body.events.length).toBeGreaterThan(0);

        const exportEvent = res.body.events.find((e: { eventType: string }) => e.eventType === 'note.exported');
        expect(exportEvent).toBeDefined();
        expect(exportEvent.details.format).toBe('json');
        expect(exportEvent.details.noteId).toBe(noteId);
    });

    // ── Audit 404 for unknown session ────────────────────────────
    it('returns 404 for audit of non-existent session', async () => {
        const res = await request(app)
            .get('/api/sessions/fake-session/audit')
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(404);
    });
});
