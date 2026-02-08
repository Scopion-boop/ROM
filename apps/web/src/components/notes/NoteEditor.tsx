'use client';

import React, { useState } from 'react';
import { CheckCircle2, FileText, Save } from 'lucide-react';

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
        <div data-testid="note-editor" className="card" style={{ padding: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <FileText size={18} style={{ color: 'var(--accent)' }} />
                <h3 style={{ fontSize: 15, fontWeight: 600 }}>Clinical Note</h3>
            </div>

            {blocks.map((block) => (
                <div key={block.id} data-testid={`note-block-${block.type}`} style={{ marginBottom: 16 }}>
                    {block.type === 'free_text' ? (
                        <textarea
                            value={block.content}
                            onChange={(e) => updateBlock(block.id, e.target.value)}
                            placeholder="Add clinical notes..."
                            data-testid="free-text-input"
                            rows={6}
                            style={{
                                width: '100%',
                                background: 'var(--bg-tertiary)',
                                color: 'var(--text-primary)',
                                border: '1px solid var(--border-primary)',
                                borderRadius: 'var(--radius-md)',
                                padding: '12px 16px',
                                fontSize: 14,
                                fontFamily: 'var(--font-sans)',
                                lineHeight: 1.7,
                                resize: 'vertical',
                                outline: 'none',
                                transition: 'border-color 0.2s ease',
                            }}
                            onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
                            onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border-primary)')}
                        />
                    ) : (
                        <p
                            style={{
                                padding: '10px 14px',
                                borderLeft: '3px solid var(--accent)',
                                background: 'var(--accent-glow)',
                                borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
                                fontSize: 14,
                                fontWeight: 500,
                            }}
                        >
                            {block.content}
                        </p>
                    )}
                </div>
            ))}

            <div style={{ display: 'flex', gap: 10, paddingTop: 8 }}>
                <button
                    className="btn-secondary"
                    onClick={() => onSave(blocks)}
                    data-testid="btn-save-note"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
                >
                    <Save size={15} /> Save Draft
                </button>
                <button
                    className="btn-primary"
                    onClick={onFinalize}
                    data-testid="btn-finalize-note"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
                >
                    <CheckCircle2 size={15} /> Finalize
                </button>
            </div>
        </div>
    );
}
