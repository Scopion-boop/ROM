'use client';
import { useState, useEffect, useCallback } from 'react';
import { usePlan } from '@/lib/plan-context';
import { authClient } from '@/lib/auth-client';
import RomTrendChart from '@/components/charts/RomTrendChart';
import Link from 'next/link';
import { Download, RefreshCw, Activity, TrendingUp, Calendar, Award } from 'lucide-react';

interface DashboardStats {
  totalSessions: number;
  totalMeasurements: number;
  avgConfidenceScore: number;
  sessionsThisMonth: number;
  sessionLimit: number;
}

interface Session {
  id: string;
  patientId?: string;
  createdAt: string;
  joint?: string;
  status?: string;
}

function SkeletonCard() {
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-primary)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-5)',
        height: 104,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(90deg, var(--bg-tertiary) 25%, var(--bg-card-hover) 50%, var(--bg-tertiary) 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s infinite',
        }}
      />
    </div>
  );
}

export default function DashboardPage() {
  const { plan, sessionsThisMonth: planSessions, sessionLimit } = usePlan();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [romTrend, setRomTrend] = useState<{ date: string; avgRom: number }[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const API = authClient.apiUrl || 'http://localhost:4000';

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const headers = authClient.getAuthHeaders();
      const [statsRes, trendRes, sessionsRes] = await Promise.all([
        fetch(`${API}/api/dashboard/stats`, { headers, credentials: 'include' }),
        fetch(`${API}/api/dashboard/rom-trend?days=30`, { headers, credentials: 'include' }),
        fetch(`${API}/api/sessions?limit=5`, { headers, credentials: 'include' }),
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (trendRes.ok) {
        const trendData = await trendRes.json();
        // API returns { dates: string[], avgRom: number[] } → transform to { date, avgRom }[]
        if (trendData.dates && trendData.avgRom) {
          setRomTrend(
            trendData.dates.map((date: string, i: number) => ({
              date,
              avgRom: trendData.avgRom[i] ?? 0,
            })),
          );
        } else if (Array.isArray(trendData)) {
          setRomTrend(trendData);
        }
      }
      if (sessionsRes.ok) {
        const data = await sessionsRes.json();
        setSessions(Array.isArray(data) ? data : (data.sessions ?? []));
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [API]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const statCards = [
    { label: 'Total Sessions', value: stats?.totalSessions ?? '—', icon: Activity },
    { label: 'Measurements', value: stats?.totalMeasurements ?? '—', icon: TrendingUp },
    {
      label: 'Avg Confidence',
      value: stats?.avgConfidenceScore != null ? `${Math.round(stats.avgConfidenceScore)}%` : '—',
      icon: Award,
    },
    { label: 'This Month', value: stats?.sessionsThisMonth ?? '—', icon: Calendar },
  ];

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 'var(--space-6)',
          }}
        >
          <div>
            <h1
              style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}
            >
              Dashboard
            </h1>
            <p
              style={{
                color: 'var(--text-muted)',
                fontSize: '0.875rem',
                margin: 'var(--space-1) 0 0',
              }}
            >
              Welcome back. Here&apos;s your clinical overview.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
            {plan !== 'free' && (
              <a
                href={`${API}/api/sessions/export/csv`}
                download
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  padding: 'var(--space-2) var(--space-4)',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-secondary)',
                  fontSize: '0.8125rem',
                  textDecoration: 'none',
                }}
              >
                <Download size={14} /> Export CSV
              </a>
            )}
            <button
              onClick={fetchData}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                padding: 'var(--space-2) var(--space-4)',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-primary)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-secondary)',
                fontSize: '0.8125rem',
                cursor: 'pointer',
              }}
            >
              <RefreshCw size={14} /> Refresh
            </button>
            <Link
              href="/sessions/new"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                padding: 'var(--space-2) var(--space-4)',
                background: 'var(--accent)',
                borderRadius: 'var(--radius-md)',
                color: '#000',
                fontSize: '0.8125rem',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              + New Session
            </Link>
          </div>
        </div>

        {/* Error state */}
        {error && !loading && (
          <div
            style={{
              padding: 'var(--space-5)',
              background: 'rgba(248,113,113,0.08)',
              border: '1px solid rgba(248,113,113,0.2)',
              borderRadius: 'var(--radius-lg)',
              marginBottom: 'var(--space-6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ color: 'var(--error)', fontSize: '0.875rem' }}>
              Failed to load dashboard data.
            </span>
            <button
              onClick={fetchData}
              style={{
                background: 'rgba(248,113,113,0.15)',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                color: 'var(--error)',
                padding: 'var(--space-2) var(--space-4)',
                cursor: 'pointer',
                fontSize: '0.8125rem',
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Stat cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 'var(--space-4)',
            marginBottom: 'var(--space-6)',
          }}
        >
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
            : statCards.map(({ label, value, icon: Icon }) => (
                <div
                  key={label}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-primary)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--space-5)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 'var(--space-3)',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        fontWeight: 600,
                      }}
                    >
                      {label}
                    </span>
                    <Icon size={16} style={{ color: 'var(--accent)' }} />
                  </div>
                  <div
                    style={{
                      fontSize: '2rem',
                      fontWeight: 700,
                      letterSpacing: '-0.02em',
                      fontFamily: 'var(--font-mono)',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {value}
                  </div>
                </div>
              ))}
        </div>

        {/* Free plan session usage bar */}
        {plan === 'free' && !loading && (
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-primary)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-5)',
              marginBottom: 'var(--space-6)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 'var(--space-3)',
              }}
            >
              <span style={{ fontSize: '0.8125rem', fontWeight: 500 }}>
                Free plan — Session Usage
              </span>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                {planSessions} / {sessionLimit} this month
              </span>
            </div>
            <div
              style={{
                height: 6,
                background: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-full)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${Math.min(100, (planSessions / sessionLimit) * 100)}%`,
                  background: planSessions >= sessionLimit ? 'var(--error)' : 'var(--accent)',
                  borderRadius: 'var(--radius-full)',
                  transition: 'width 0.5s ease',
                }}
              />
            </div>
            {planSessions >= sessionLimit && (
              <p
                style={{ fontSize: '0.75rem', color: 'var(--error)', marginTop: 'var(--space-2)' }}
              >
                Monthly limit reached.{' '}
                <Link
                  href="/dashboard/billing"
                  style={{ color: 'var(--accent)', textDecoration: 'underline' }}
                >
                  Upgrade to continue
                </Link>
                .
              </p>
            )}
          </div>
        )}

        {/* Two-column: ROM trend + Recent sessions */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 'var(--space-6)',
            marginBottom: 'var(--space-6)',
          }}
        >
          {/* ROM Trend Chart */}
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-primary)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-5)',
            }}
          >
            <h2 style={{ fontSize: '0.9375rem', fontWeight: 600, margin: '0 0 var(--space-4)' }}>
              ROM Trend (30 Days)
            </h2>
            {loading ? (
              <div
                style={{
                  height: 280,
                  background: 'var(--bg-tertiary)',
                  borderRadius: 'var(--radius-md)',
                  animation: 'shimmer 1.5s infinite',
                  backgroundSize: '200% 100%',
                  backgroundImage:
                    'linear-gradient(90deg, var(--bg-tertiary) 25%, var(--bg-card-hover) 50%, var(--bg-tertiary) 75%)',
                }}
              />
            ) : (
              <RomTrendChart data={romTrend} />
            )}
          </div>

          {/* Recent Sessions */}
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-primary)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-5)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 'var(--space-4)',
              }}
            >
              <h2 style={{ fontSize: '0.9375rem', fontWeight: 600, margin: 0 }}>Recent Sessions</h2>
              <Link
                href="/sessions"
                style={{ fontSize: '0.75rem', color: 'var(--accent)', textDecoration: 'none' }}
              >
                View all
              </Link>
            </div>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      height: 40,
                      background: 'var(--bg-tertiary)',
                      borderRadius: 'var(--radius-md)',
                      animation: 'shimmer 1.5s infinite',
                      backgroundSize: '200% 100%',
                      backgroundImage:
                        'linear-gradient(90deg, var(--bg-tertiary) 25%, var(--bg-card-hover) 50%, var(--bg-tertiary) 75%)',
                    }}
                  />
                ))}
              </div>
            ) : sessions.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: 'var(--space-8)',
                  color: 'var(--text-muted)',
                  fontSize: '0.875rem',
                }}
              >
                No sessions yet.{' '}
                <Link
                  href="/sessions/new"
                  style={{ color: 'var(--accent)', textDecoration: 'none' }}
                >
                  Start your first session
                </Link>
                .
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr auto',
                      alignItems: 'center',
                      padding: 'var(--space-2) var(--space-3)',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--bg-tertiary)',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 500 }}>
                        {session.joint || 'Session'}
                      </div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                        {session.createdAt ? new Date(session.createdAt).toLocaleDateString() : '—'}
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: '0.6875rem',
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-full)',
                        background: 'rgba(14,205,186,0.12)',
                        color: 'var(--accent)',
                        fontWeight: 600,
                      }}
                    >
                      {session.status || 'Complete'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
