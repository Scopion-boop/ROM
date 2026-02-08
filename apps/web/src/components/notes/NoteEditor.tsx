'use client';

import React, { useState } from 'react';

interface NoteBlock {
    id: string;
    type: string;
    content: string;
}

export default function NoteEditor({
    blocks: initialBlocks,
    onSave,
    onFinalize,
}: Readonly<{
    blocks: NoteBlock[];
    onSave: (blocks: NoteBlock[]) => void;
    onFinalize: () => void;
}>) {
    const [blocks, setBlocks] = useState<NoteBlock[]>(initialBlocks);

    const updateBlock = (id: string, content: string) => {
        setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, content } : b)));
    };

    return (
        <div data-testid="note-editor">
            <h3>Clinical Note</h3>
            {blocks.map((block) => (
                <div key={block.id} data-testid={`note-block-${block.type}`} style={{ marginBottom: 8 }}>
                    {block.type === 'free_text' ? (
                        <textarea
                            value={block.content}
                            onChange={(e) => updateBlock(block.id, e.target.value)}
                            placeholder="Add clinical notes..."
                            data-testid="free-text-input"
                            rows={3}
                            style={{ width: '100%' }}
                        />
                    ) : (
                        <p>
                            <strong>{block.type}:</strong> {block.content}
                        </p>
                    )}
                </div>
            ))}
            <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => onSave(blocks)} data-testid="btn-save-note">
                    Save Draft
                </button>
                <button onClick={onFinalize} data-testid="btn-finalize-note">
                    Finalize
                </button>
            </div>
        </div>
    );
}
