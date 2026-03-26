'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Download, Clipboard } from 'lucide-react';
import NoteRenderer from '@/components/notes/NoteRenderer';
import { processCaptures } from '@/lib/rom-utils';
import { generateNote, type GeneratedNote } from '@/lib/note-generator';
import type { CapturedMeasurement } from '@physiolens/shared-types';

type JointType = CapturedMeasurement['joint'];
type MovementType = CapturedMeasurement['movement'];

interface SessionData {
  id: string;
  patientId?: string;
  joints: string[];
  status: string;
  createdAt: string;
}

interface MeasurementData {
  id: string;
  joint: string;
  movement: string;
  side: string;
  romDegrees: number;
  confidenceScore: number;
  createdAt: string;
}

export default function SessionViewPage() {
  const params = useParams();
  const id = params?.id as string;

  const [session, setSession] = useState<SessionData | null>(null);
  const [note, setNote] = useState<GeneratedNote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyNote = async () => {
    if (!note) return;
    const noteText = note.sections.map((s) => `${s.title}\n${s.content}`).join('\n\n');
    try {
      await navigator.clipboard.writeText(noteText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  useEffect(() => {
    if (!id) return;

    Promise.all([
      fetch(`/api/sessions/${id}`, { credentials: 'include' }).then(async (res) => {
        if (!res.ok) throw new Error('Session not found');
        return res.json() as Promise<SessionData>;
      }),
      fetch(`/api/sessions/${id}/measurements`, { credentials: 'include' }).then(async (res) => {
        if (!res.ok) throw new Error('Failed to load measurements');
        return res.json() as Promise<MeasurementData[]>;
      }),
    ])
      .then(([sessionData, measurements]) => {
        setSession(sessionData);

        const captures: CapturedMeasurement[] = measurements.map((m) => ({
          joint: m.joint as JointType,
          movement: m.movement as MovementType,
          side: m.side as 'left' | 'right' | 'midline',
          romDegrees: m.romDegrees,
          confidence: m.confidenceScore,
          timestamp: new Date(m.createdAt).getTime(),
        }));

        if (captures.length > 0) {
          const enriched = processCaptures(captures);
          setNote(generateNote(enriched));
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <main data-testid="session-view-page" style={{ maxWidth: 960, margin: '0 auto' }}>
      <Link
        href="/sessions"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 14,
          color: 'var(--accent)',
          textDecoration: 'none',
          marginBottom: 20,
          fontWeight: 500,
        }}
      >
        &larr; Back to Sessions
      </Link>

      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div
            style={{
              width: 32,
              height: 32,
              border: '3px solid var(--border-primary)',
              borderTopColor: 'var(--accent)',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }}
          />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {error && (
        <div
          style={{
            padding: 24,
            background: 'rgba(239,68,68,0.08)',
            borderRadius: 8,
            color: 'var(--error)',
            fontSize: 14,
          }}
        >
          {error}
        </div>
      )}

      {!loading && !error && session && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <h1
              style={{
                flex: 1,
                fontSize: '1.8rem',
                fontWeight: 700,
                letterSpacing: '-0.03em',
                color: 'var(--text-primary)',
                margin: 0,
              }}
            >
              {session.patientId || 'Unnamed Session'}
            </h1>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handlePrint}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Download size={16} />
              Print / PDF
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleCopyNote}
              disabled={!note}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Clipboard size={16} />
              {copied ? 'Copied!' : 'Copy Note'}
            </button>
          </div>
          <p style={{ color: 'var(--text-tertiary)', marginBottom: 24, fontSize: 14 }}>
            {new Date(session.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>

          {note ? (
            <NoteRenderer note={note} />
          ) : (
            <div
              style={{
                textAlign: 'center',
                padding: '40px 24px',
                background: 'var(--bg-secondary)',
                borderRadius: 12,
                border: '1px solid var(--border-primary)',
                color: 'var(--text-secondary)',
                fontSize: 14,
              }}
            >
              No measurements recorded for this session.
            </div>
          )}
        </>
      )}
    </main>
  );
}
