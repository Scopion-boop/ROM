import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../app';
import { getRepos } from '../../repositories/repo-factory';

async function registerAndToken(): Promise<string> {
  const res = await request(app)
    .post('/api/auth/register')
    .send({
      email: `note-test-${Date.now()}@test.com`,
      password: 'P@ssw0rd!',
      organizationId: 'org-note-001',
      role: 'clinician',
    });
  return res.body.token;
}

async function createSessionWithMeasurement(token: string) {
  const session = await request(app)
    .post('/api/sessions')
    .set('Authorization', `Bearer ${token}`)
    .send({ joints: ['shoulder'] });

  await request(app)
    .post(`/api/sessions/${session.body.id}/measurements`)
    .set('Authorization', `Bearer ${token}`)
    .send({
      joint: 'shoulder',
      movement: 'flexion',
      side: 'right',
      romDegrees: 155,
      confidenceScore: 0.93,
      qualityFlags: [
        { code: 'LOW_VISIBILITY', message: 'Minor occlusion detected', severity: 'warning' },
      ],
      algorithmVersion: 'v1.0',
      captureDurationMs: 2100,
    });

  return session.body;
}

describe('Note Generation & Editing', () => {
  let token: string;

  beforeEach(async () => {
    const repos = getRepos();
    await repos.sessions._clear();
    await repos.measurements._clear();
    await repos.notes._clear();
    await repos.users._clear();
    token = await registerAndToken();
  });

  it('POST /api/sessions/:id/notes/generate — generates a draft note', async () => {
    const session = await createSessionWithMeasurement(token);

    const res = await request(app)
      .post(`/api/sessions/${session.id}/notes/generate`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('draft');
    expect(res.body.sessionId).toBe(session.id);
    expect(res.body.blocks.length).toBeGreaterThanOrEqual(3); // header + measurement + quality + free_text
  });

  it('note blocks contain measurement summary', async () => {
    const session = await createSessionWithMeasurement(token);

    const res = await request(app)
      .post(`/api/sessions/${session.id}/notes/generate`)
      .set('Authorization', `Bearer ${token}`);

    const summaryBlock = res.body.blocks.find((b: any) => b.type === 'measurement_summary');
    expect(summaryBlock).toBeDefined();
    expect(summaryBlock.content).toContain('155°');
    expect(summaryBlock.content).toContain('flexion');
  });

  it('note blocks include quality warnings', async () => {
    const session = await createSessionWithMeasurement(token);

    const res = await request(app)
      .post(`/api/sessions/${session.id}/notes/generate`)
      .set('Authorization', `Bearer ${token}`);

    const qualityBlock = res.body.blocks.find((b: any) => b.type === 'quality_note');
    expect(qualityBlock).toBeDefined();
    expect(qualityBlock.content).toContain('LOW_VISIBILITY');
  });

  it('rejects note generation when no measurements exist', async () => {
    const session = await request(app)
      .post('/api/sessions')
      .set('Authorization', `Bearer ${token}`)
      .send({ joints: ['knee'] });

    const res = await request(app)
      .post(`/api/sessions/${session.body.id}/notes/generate`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
  });

  it('GET /api/sessions/:id/notes — lists session notes', async () => {
    const session = await createSessionWithMeasurement(token);

    await request(app)
      .post(`/api/sessions/${session.id}/notes/generate`)
      .set('Authorization', `Bearer ${token}`);

    const res = await request(app)
      .get(`/api/sessions/${session.id}/notes`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
  });

  it('PATCH /api/sessions/notes/:noteId/blocks — updates note blocks', async () => {
    const session = await createSessionWithMeasurement(token);

    const generated = await request(app)
      .post(`/api/sessions/${session.id}/notes/generate`)
      .set('Authorization', `Bearer ${token}`);

    const noteId = generated.body.id;
    const newBlocks = [{ id: 'b1', type: 'free_text', content: 'Clinician added note here' }];

    const res = await request(app)
      .patch(`/api/sessions/notes/${noteId}/blocks`)
      .set('Authorization', `Bearer ${token}`)
      .send({ blocks: newBlocks });

    expect(res.status).toBe(200);
    expect(res.body.blocks[0].content).toBe('Clinician added note here');
  });

  it('PATCH /api/sessions/notes/:noteId/status — finalizes a note', async () => {
    const session = await createSessionWithMeasurement(token);

    const generated = await request(app)
      .post(`/api/sessions/${session.id}/notes/generate`)
      .set('Authorization', `Bearer ${token}`);

    const res = await request(app)
      .patch(`/api/sessions/notes/${generated.body.id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'finalized' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('finalized');
  });
});
