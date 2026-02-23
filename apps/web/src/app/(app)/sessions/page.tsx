'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

interface SessionItem {
    id: string;
    patientId?: string;
    createdAt: string;
    joints: string[];
    status: string;
}

function formatDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function statusBadge(status: string) {
    const colors: Record<string, { bg: string; color: string }> = {
        created: { bg: 'rgba(59,130,246,0.12)', color: '#3b82f6' },
        in_progress: { bg: 'rgba(234,179,8,0.12)', color: '#ca8a04' },
        finalized: { bg: 'rgba(34,197,94,0.12)', color: '#16a34a' },
    };
    const c = colors[status] ?? { bg: 'rgba(107,114,128,0.12)', color: '#6b7280' };
    return (
        <span style={{
            display: 'inline-block',
            padding: '2px 10px',
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 600,
            background: c.bg,
            color: c.color,
            textTransform: 'capitalize',
        }}>
            {status.replace(/_/g, ' ')}
        </span>
    );
}

export default function SessionsPage() {
    const [sessions, setSessions] = useState<SessionItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch('/api/sessions', { credentials: 'include' })
            .then(async (res) => {
                if (!res.ok) throw new Error('Failed to load sessions');
                const data = await res.json();
                return data as SessionItem[];
            })
            .then((data) => {
                const sorted = data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                setSessions(sorted);
            })
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    return (
        <main data-testid="sessions-page" style={{ maxWidth: 960, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
                    Saved Sessions
                </h1>
                <Link
                    href="/sessions/new"
                    className="btn btn-primary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}
                >
                    + New Session
                </Link>
            </div>

            {loading && (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
                    <div style={{
                        width: 32,
                        height: 32,
                        border: '3px solid var(--border-primary)',
                        borderTopColor: 'var(--accent)',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                    }} />
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
            )}

            {error && (
                <div style={{ padding: 24, background: 'rgba(239,68,68,0.08)', borderRadius: 8, color: '#dc2626', fontSize: 14 }}>
                    {error}
                </div>
            )}

            {!loading && !error && sessions.length === 0 && (
                <div style={{
                    textAlign: 'center',
                    padding: '60px 24px',
                    background: 'var(--bg-secondary)',
                    borderRadius: 12,
                    border: '1px solid var(--border-primary)',
                }}>
                    <p style={{ fontSize: 16, color: 'var(--text-secondary)', marginBottom: 16 }}>
                        No saved sessions yet.
                    </p>
                    <Link
                        href="/sessions/new"
                        className="btn btn-primary"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}
                    >
                        Start your first session
                    </Link>
                </div>
            )}

            {!loading && !error && sessions.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {sessions.map((s) => (
                        <Link
                            key={s.id}
                            href={`/sessions/${s.id}`}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '16px 20px',
                                background: 'var(--bg-secondary)',
                                border: '1px solid var(--border-primary)',
                                borderRadius: 10,
                                textDecoration: 'none',
                                color: 'var(--text-primary)',
                                transition: 'border-color 0.2s ease',
                            }}
                        >
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <span style={{ fontSize: 15, fontWeight: 600 }}>
                                    {s.patientId || 'Unnamed Session'}
                                </span>
                                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                    {formatDate(s.createdAt)}
                                </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                                    {Array.isArray(s.joints) ? s.joints.map((j) => j.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')).join(', ') : ''}
                                </span>
                                {statusBadge(s.status)}
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </main>
    );
}
