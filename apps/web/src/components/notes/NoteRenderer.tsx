'use client';

import React, { useCallback, useRef, useState } from 'react';
import { Clipboard, ClipboardCheck, Download, FileText } from 'lucide-react';
import type { GeneratedNote } from '@/lib/note-generator';
import { noteToPlainText } from '@/lib/note-generator';

// ─── Simplified Text Box ──────────────────────────────────────────

function SimplifiedTextBox({ text }: Readonly<{ text: string }>) {
  const textRef = useRef<HTMLTextAreaElement>(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    globalThis.setTimeout(() => setCopied(false), 2000);
  }, [text]);

  return (
    <div
      style={{
        margin: '8px 20px 16px',
        border: '1px solid var(--border-primary)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border-primary)',
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
          Quick Copy — Paste into EMR
        </span>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={handleCopy}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            fontSize: 11,
            padding: '4px 10px',
          }}
        >
          {copied ? (
            <>
              <ClipboardCheck size={12} /> Copied!
            </>
          ) : (
            <>
              <Clipboard size={12} /> Copy
            </>
          )}
        </button>
      </div>
      <textarea
        ref={textRef}
        readOnly
        value={text}
        onClick={() => textRef.current?.select()}
        style={{
          width: '100%',
          minHeight: 140,
          padding: '12px 14px',
          fontFamily: 'var(--font-mono)',
          fontSize: 13,
          lineHeight: 1.7,
          background: 'var(--bg-primary)',
          color: 'var(--text-primary)',
          border: 'none',
          outline: 'none',
          resize: 'vertical',
        }}
      />
    </div>
  );
}

// ─── Main NoteRenderer ─────────────────────────────────────────────

export default function NoteRenderer({
  note,
}: Readonly<{
  note: GeneratedNote;
}>) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    const text = noteToPlainText(note);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    globalThis.setTimeout(() => setCopied(false), 2000);
  }, [note]);

  const handlePrint = useCallback(() => {
    globalThis.print();
  }, []);

  return (
    <div data-testid="note-renderer" className="card" style={{ overflow: 'hidden' }}>
      {/* ─── Toolbar ─── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 20px',
          borderBottom: '1px solid var(--border-primary)',
          background: 'var(--bg-secondary)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <FileText size={17} style={{ color: 'var(--accent)' }} />
          <h3 style={{ fontSize: 15, fontWeight: 600 }}>Clinical Note</h3>
          <span
            style={{
              fontSize: 11,
              padding: '2px 8px',
              borderRadius: 999,
              background: 'var(--accent-glow)',
              color: 'var(--accent)',
              fontWeight: 600,
            }}
          >
            {note.measurementCount} measurements
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn btn-secondary"
            onClick={handleCopy}
            data-testid="btn-copy-note"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              padding: '6px 12px',
            }}
          >
            {copied ? (
              <>
                <ClipboardCheck size={13} /> Copied!
              </>
            ) : (
              <>
                <Clipboard size={13} /> Copy
              </>
            )}
          </button>
          <button
            className="btn btn-secondary"
            onClick={handlePrint}
            data-testid="btn-print-note"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              padding: '6px 12px',
            }}
          >
            <Download size={13} /> Print / PDF
          </button>
        </div>
      </div>

      {/* ─── Simplified Text Box ─── */}
      {note.simplifiedText && <SimplifiedTextBox text={note.simplifiedText} />}

      {/* ─── Footer ─── */}
      <div
        style={{
          padding: '12px 20px',
          borderTop: '1px solid var(--border-primary)',
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 11,
          color: 'var(--text-muted)',
        }}
      >
        <span>Generated {new Date(note.generatedAt).toLocaleString()}</span>
        <span>{note.jointsCovered.join(', ')}</span>
      </div>
    </div>
  );
}
