/**
 * Integration tests for Drizzle NoteRepo.
 *
 * Notes have a FK to sessions, so tests create a session first.
 *
 * Prerequisites:
 * - TEST_DATABASE_URL must be set
 * - PostgreSQL test database must be running
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { randomUUID } from 'node:crypto';
import { createDrizzleNoteRepo } from '../note-repo';
import { createDrizzleSessionRepo } from '../session-repo';
import {
    setupIntegrationTestHooks,
    TEST_ORG_ID,
    TEST_CLINICIAN_ID,
} from './test-setup';
import type { NoteBlock } from '../../interfaces';

describe('DrizzleNoteRepo Integration Tests', () => {
    setupIntegrationTestHooks();

    const noteRepo = createDrizzleNoteRepo();
    const sessionRepo = createDrizzleSessionRepo();
    let sessionId: string;

    beforeEach(async () => {
        const session = await sessionRepo.create({
            organizationId: TEST_ORG_ID,
            clinicianId: TEST_CLINICIAN_ID,
            joints: ['shoulder'],
        });
        sessionId = session.id;
    });

    const sampleBlocks: NoteBlock[] = [
        { id: 'b1', type: 'paragraph', content: 'Patient presents with shoulder pain.' },
        { id: 'b2', type: 'heading', content: 'Assessment' },
    ];

    describe('save()', () => {
        it('should save a note with all fields', async () => {
            const noteId = randomUUID();
            const note = await noteRepo.save({
                id: noteId,
                sessionId,
                status: 'draft',
                blocks: sampleBlocks,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            });

            expect(note.id).toBe(noteId);
            expect(note.sessionId).toBe(sessionId);
            expect(note.status).toBe('draft');
            expect(note.blocks).toEqual(sampleBlocks);
            expect(note.createdAt).toBeDefined();
            expect(note.updatedAt).toBeDefined();
        });

        it('should save a note with empty blocks', async () => {
            const note = await noteRepo.save({
                id: randomUUID(),
                sessionId,
                status: 'draft',
                blocks: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            });

            expect(note.blocks).toEqual([]);
        });
    });

    describe('getById()', () => {
        it('should retrieve an existing note', async () => {
            const noteId = randomUUID();
            await noteRepo.save({
                id: noteId,
                sessionId,
                status: 'draft',
                blocks: sampleBlocks,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            });

            const retrieved = await noteRepo.getById(noteId);

            expect(retrieved).toBeDefined();
            expect(retrieved?.id).toBe(noteId);
            expect(retrieved?.blocks).toEqual(sampleBlocks);
        });

        it('should return undefined for non-existent note', async () => {
            const result = await noteRepo.getById('00000000-0000-0000-0000-000000000999');
            expect(result).toBeUndefined();
        });
    });

    describe('listBySession()', () => {
        it('should return all notes for a session', async () => {
            await noteRepo.save({
                id: randomUUID(),
                sessionId,
                status: 'draft',
                blocks: [{ id: 'b1', type: 'paragraph', content: 'Note 1' }],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            });

            await noteRepo.save({
                id: randomUUID(),
                sessionId,
                status: 'review',
                blocks: [{ id: 'b2', type: 'paragraph', content: 'Note 2' }],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            });

            const notes = await noteRepo.listBySession(sessionId);
            expect(notes).toHaveLength(2);
            expect(notes.every((n) => n.sessionId === sessionId)).toBe(true);
        });

        it('should return empty array for session with no notes', async () => {
            const notes = await noteRepo.listBySession(sessionId);
            expect(notes).toEqual([]);
        });
    });

    describe('updateBlocks()', () => {
        it('should update the blocks of an existing note', async () => {
            const noteId = randomUUID();
            await noteRepo.save({
                id: noteId,
                sessionId,
                status: 'draft',
                blocks: sampleBlocks,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            });

            const newBlocks: NoteBlock[] = [
                { id: 'b3', type: 'paragraph', content: 'Updated content.' },
            ];

            const updated = await noteRepo.updateBlocks(noteId, newBlocks);

            expect(updated).toBeDefined();
            expect(updated?.blocks).toEqual(newBlocks);
        });

        it('should return undefined for non-existent note', async () => {
            const result = await noteRepo.updateBlocks('00000000-0000-0000-0000-000000000999', []);
            expect(result).toBeUndefined();
        });
    });

    describe('updateStatus()', () => {
        it('should update the status of an existing note', async () => {
            const noteId = randomUUID();
            await noteRepo.save({
                id: noteId,
                sessionId,
                status: 'draft',
                blocks: sampleBlocks,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            });

            const updated = await noteRepo.updateStatus(noteId, 'approved');

            expect(updated).toBeDefined();
            expect(updated?.status).toBe('approved');
        });

        it('should return undefined for non-existent note', async () => {
            const result = await noteRepo.updateStatus('00000000-0000-0000-0000-000000000999', 'approved');
            expect(result).toBeUndefined();
        });
    });
});
