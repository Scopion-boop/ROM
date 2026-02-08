import { eq } from 'drizzle-orm';
import { getDb, notes } from '../../db';
import type { NoteRepo, NoteRecord, NoteBlock } from '../interfaces';

function rowToRecord(row: typeof notes.$inferSelect): NoteRecord {
    return {
        id: row.id,
        sessionId: row.sessionId,
        status: row.status,
        blocks: row.blocks as NoteBlock[],
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
    };
}

export function createDrizzleNoteRepo(): NoteRepo {
    return {
        async save(note) {
            const db = getDb();
            const rows = await db
                .insert(notes)
                .values({
                    id: note.id,
                    sessionId: note.sessionId,
                    status: note.status as typeof notes.$inferInsert.status,
                    blocks: note.blocks,
                })
                .returning();
            return rowToRecord(rows[0]!);
        },

        async getById(id) {
            const db = getDb();
            const rows = await db.select().from(notes).where(eq(notes.id, id));
            return rows[0] ? rowToRecord(rows[0]) : undefined;
        },

        async listBySession(sessionId) {
            const db = getDb();
            const rows = await db
                .select()
                .from(notes)
                .where(eq(notes.sessionId, sessionId));
            return rows.map(rowToRecord);
        },

        async updateBlocks(id: string, blocks: NoteBlock[]) {
            const db = getDb();
            const rows = await db
                .update(notes)
                .set({ blocks, updatedAt: new Date() })
                .where(eq(notes.id, id))
                .returning();
            return rows[0] ? rowToRecord(rows[0]) : undefined;
        },

        async updateStatus(id: string, status: string) {
            const db = getDb();
            const rows = await db
                .update(notes)
                .set({
                    status: status as typeof notes.$inferInsert.status,
                    updatedAt: new Date(),
                })
                .where(eq(notes.id, id))
                .returning();
            return rows[0] ? rowToRecord(rows[0]) : undefined;
        },

        async _clear() {
            const db = getDb();
            await db.delete(notes);
        },
    };
}
