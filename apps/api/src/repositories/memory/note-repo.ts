import type { NoteRepo, NoteRecord, NoteBlock } from '../interfaces';

export function createMemoryNoteRepo(): NoteRepo {
    const store = new Map<string, NoteRecord>();

    return {
        async save(note) {
            store.set(note.id, note);
            return note;
        },

        async getById(id) {
            return store.get(id);
        },

        async listBySession(sessionId) {
            return [...store.values()].filter((n) => n.sessionId === sessionId);
        },

        async updateBlocks(id: string, blocks: NoteBlock[]) {
            const note = store.get(id);
            if (!note) return undefined;
            note.blocks = blocks;
            note.updatedAt = new Date().toISOString();
            return note;
        },

        async updateStatus(id: string, status: string) {
            const note = store.get(id);
            if (!note) return undefined;
            note.status = status;
            note.updatedAt = new Date().toISOString();
            return note;
        },

        async _clear() {
            store.clear();
        },
    };
}
