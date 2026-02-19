'use client';
import { useState, useEffect } from 'react';
import { usePlan } from '@/lib/plan-context';
import { authClient } from '@/lib/auth-client';
import { UpgradePrompt } from '@/components/billing/UpgradePrompt';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, TrendingUp, Award, Activity, Plus, X, Link as LinkIcon, Check } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface Clinician {
  id: string;
  displayName: string;
  email: string;
  role: string;
  sessionCount: number;
  lastActive: string;
}

interface Stats {
  totalSessions: number;
  avgConfidence: number;
  topJoint: string;
  utilisationRate: number;
}

export default function ClinicDashboardPage() {
  const { plan, loading } = usePlan();
  const [clinicians, setClinicians] = useState<Clinician[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('clinician');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [patientLinkMap, setPatientLinkMap] = useState<Record<string, string>>({});
  const [generatingLink, setGeneratingLink] = useState<string | null>(null);

  useEffect(() => {
    if (plan !== 'practice') return;

    const fetchData = async () => {
      try {
        const headers = authClient.getAuthHeaders();
        const [clinRes, statsRes] = await Promise.all([
          fetch(`${API}/api/clinic/clinicians`, { headers }),
          fetch(`${API}/api/clinic/stats`, { headers }),
        ]);
        if (clinRes.ok) setClinicians(await clinRes.json());
        if (statsRes.ok) setStats(await statsRes.json());
      } catch (error) {
        console.error('Failed to fetch clinic data:', error);
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [plan]);

  const handleInvite = async () => {
    setInviteLoading(true);
    try {
      const res = await fetch(`${API}/api/clinic/invite`, {
        method: 'POST',
        headers: { ...authClient.getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      if (res.ok) {
        setInviteSuccess(true);
        setTimeout(() => {
          setShowInviteModal(false);
          setInviteSuccess(false);
          setInviteEmail('');
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to send invite:', error);
    } finally {
      setInviteLoading(false);
    }
  };

  const generatePatientLink = async (clinicianId: string) => {
    setGeneratingLink(clinicianId);
    try {
      const res = await fetch(`${API}/api/patient-links`, {
        method: 'POST',
        headers: { ...authClient.getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ joints: [] }),
      });
      if (res.ok) {
        const { token } = await res.json();
        const link = `${window.location.origin}/patient/${token}`;
        setPatientLinkMap(prev => ({ ...prev, [clinicianId]: link }));
      }
    } catch (error) {
      console.error('Failed to generate patient link:', error);
    } finally {
      setGeneratingLink(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Plan guard
  if (!loading && plan !== 'practice') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <UpgradePrompt
          feature="Clinic Admin Dashboard"
          requiredPlan="practice"
          onDismiss={() => undefined}
        />
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div style={{ padding: 'var(--space-6)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
          {[1, 2, 3, 4].map(i => (
            <ShimmerCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  const chartData = clinicians.map(c => ({
    name: c.displayName?.split(' ')[0] || 'Unknown',
    sessions: c.sessionCount || 0,
  }));

  return (
    <div style={{ padding: 'var(--space-6)', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 'var(--space-6)',
      }}>
        <h1 style={{
          fontSize: '1.75rem',
          fontWeight: 600,
          color: 'var(--text-primary)',
          margin: 0,
        }}>
          Clinic Dashboard
        </h1>
        <button
          onClick={() => setShowInviteModal(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            padding: 'var(--space-2) var(--space-4)',
            backgroundColor: 'var(--accent)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.875rem',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--accent-dark)')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--accent)')}
        >
          <Plus size={18} />
          Invite Clinician
        </button>
      </div>

      {/* Stat Cards */}
      {loadingData ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-6)',
        }}>
          {[1, 2, 3, 4].map(i => (
            <ShimmerCard key={i} />
          ))}
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-6)',
        }}>
          <StatCard
            icon={<Activity size={24} />}
            label="Total Sessions"
            value={stats?.totalSessions?.toString() ?? '—'}
          />
          <StatCard
            icon={<Award size={24} />}
            label="Avg Confidence"
            value={stats?.avgConfidence ? `${Math.round(stats.avgConfidence)}%` : '—'}
          />
          <StatCard
            icon={<TrendingUp size={24} />}
            label="Top Joint"
            value={stats?.topJoint ?? '—'}
          />
          <StatCard
            icon={<Users size={24} />}
            label="Utilisation"
            value={stats?.utilisationRate ? `${Math.round(stats.utilisationRate)}%` : '—'}
          />
        </div>
      )}

      {/* Clinicians Table */}
      <div style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-primary)',
        borderRadius: 'var(--radius-lg)',
        marginBottom: 'var(--space-6)',
        overflow: 'hidden',
      }}>
        <div style={{
          padding: 'var(--space-4)',
          borderBottom: '1px solid var(--border-primary)',
        }}>
          <h2 style={{
            fontSize: '1.125rem',
            fontWeight: 600,
            color: 'var(--text-primary)',
            margin: 0,
          }}>
            Clinicians
          </h2>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '0.875rem',
          }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                {['Name', 'Email', 'Role', 'Sessions', 'Last Active', 'Status', 'Action'].map(header => (
                  <th key={header} style={{
                    padding: 'var(--space-3) var(--space-4)',
                    textAlign: 'left',
                    fontWeight: 500,
                    color: 'var(--text-secondary)',
                    borderBottom: '1px solid var(--border-primary)',
                  }}>
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clinicians.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{
                    padding: 'var(--space-8)',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                  }}>
                    No clinicians found. Invite your team to get started.
                  </td>
                </tr>
              ) : (
                clinicians.map(clinician => (
                  <tr key={clinician.id} style={{
                    borderBottom: '1px solid var(--border-secondary)',
                  }}>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--text-primary)' }}>
                      {clinician.displayName}
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--text-secondary)' }}>
                      {clinician.email}
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        backgroundColor: clinician.role === 'clinic_admin' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(20, 184, 166, 0.15)',
                        color: clinician.role === 'clinic_admin' ? '#8b5cf6' : 'var(--accent)',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        textTransform: 'capitalize',
                      }}>
                        {clinician.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--text-primary)' }}>
                      {clinician.sessionCount || 0}
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--text-secondary)' }}>
                      {formatDate(clinician.lastActive)}
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        backgroundColor: 'rgba(34, 197, 94, 0.15)',
                        color: '#22c55e',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                      }}>
                        Active
                      </span>
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                      {patientLinkMap[clinician.id] ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <button
                            onClick={() => copyToClipboard(patientLinkMap[clinician.id]!)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '4px 8px',
                              backgroundColor: 'rgba(34, 197, 94, 0.15)',
                              color: '#22c55e',
                              border: 'none',
                              borderRadius: 'var(--radius-md)',
                              fontSize: '0.75rem',
                              cursor: 'pointer',
                            }}
                          >
                            <Check size={14} />
                            Copy Link
                          </button>
                          <span style={{
                            fontSize: '0.625rem',
                            color: 'var(--text-muted)',
                            maxWidth: '150px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}>
                            {patientLinkMap[clinician.id]}
                          </span>
                        </div>
                      ) : (
                        <button
                          onClick={() => generatePatientLink(clinician.id)}
                          disabled={generatingLink === clinician.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '6px 12px',
                            backgroundColor: 'var(--bg-tertiary)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--border-primary)',
                            borderRadius: 'var(--radius-md)',
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            cursor: generatingLink === clinician.id ? 'wait' : 'pointer',
                            opacity: generatingLink === clinician.id ? 0.7 : 1,
                          }}
                        >
                          {generatingLink === clinician.id ? (
                            'Generating...'
                          ) : (
                            <>
                              <LinkIcon size={14} />
                              Send Assessment
                            </>
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sessions Per Clinician Chart */}
      {clinicians.length > 0 && (
        <div style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-primary)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-4)',
        }}>
          <h2 style={{
            fontSize: '1.125rem',
            fontWeight: 600,
            color: 'var(--text-primary)',
            margin: 0,
            marginBottom: 'var(--space-4)',
          }}>
            Sessions Per Clinician
          </h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-secondary)" />
              <XAxis
                dataKey="name"
                tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                axisLine={{ stroke: 'var(--border-primary)' }}
                tickLine={{ stroke: 'var(--border-primary)' }}
              />
              <YAxis
                tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                axisLine={{ stroke: 'var(--border-primary)' }}
                tickLine={{ stroke: 'var(--border-primary)' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                }}
              />
              <Bar dataKey="sessions" fill="#14b8a6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-primary)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-6)',
            maxWidth: '400px',
            width: '100%',
            position: 'relative',
          }}>
            <button
              onClick={() => {
                setShowInviteModal(false);
                setInviteSuccess(false);
                setInviteEmail('');
              }}
              style={{
                position: 'absolute',
                top: 'var(--space-4)',
                right: 'var(--space-4)',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              <X size={20} />
            </button>

            {inviteSuccess ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 'var(--space-4)',
                padding: 'var(--space-6)',
              }}>
                <div style={{
                  width: 60,
                  height: 60,
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'rgba(34, 197, 94, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Check size={32} color="#22c55e" />
                </div>
                <span style={{
                  fontSize: '1.125rem',
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                }}>
                  Invite sent!
                </span>
              </div>
            ) : (
              <>
                <h2 style={{
                  fontSize: '1.25rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  margin: 0,
                  marginBottom: 'var(--space-6)',
                }}>
                  Invite Clinician
                </h2>

                <div style={{ marginBottom: 'var(--space-4)' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: 'var(--text-secondary)',
                    marginBottom: 'var(--space-2)',
                  }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    placeholder="clinician@example.com"
                    style={{
                      width: '100%',
                      padding: 'var(--space-3)',
                      backgroundColor: 'var(--bg-primary)',
                      border: '1px solid var(--border-primary)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-primary)',
                      fontSize: '0.875rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div style={{ marginBottom: 'var(--space-6)' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: 'var(--text-secondary)',
                    marginBottom: 'var(--space-2)',
                  }}>
                    Role
                  </label>
                  <select
                    value={inviteRole}
                    onChange={e => setInviteRole(e.target.value)}
                    style={{
                      width: '100%',
                      padding: 'var(--space-3)',
                      backgroundColor: 'var(--bg-primary)',
                      border: '1px solid var(--border-primary)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-primary)',
                      fontSize: '0.875rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="clinician">Clinician</option>
                    <option value="clinic_admin">Clinic Admin</option>
                  </select>
                </div>

                <button
                  onClick={handleInvite}
                  disabled={!inviteEmail || inviteLoading}
                  style={{
                    width: '100%',
                    padding: 'var(--space-3)',
                    backgroundColor: !inviteEmail || inviteLoading ? 'var(--text-muted)' : 'var(--accent)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    cursor: !inviteEmail || inviteLoading ? 'not-allowed' : 'pointer',
                    transition: 'background-color 0.2s',
                  }}
                >
                  {inviteLoading ? 'Sending...' : 'Send Invite'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{
      backgroundColor: 'var(--bg-card)',
      border: '1px solid var(--border-primary)',
      borderRadius: 'var(--radius-lg)',
      padding: 'var(--space-4)',
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-4)',
    }}>
      <div style={{
        width: 48,
        height: 48,
        borderRadius: 'var(--radius-md)',
        backgroundColor: 'rgba(20, 184, 166, 0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--accent)',
        flexShrink: 0,
      }}>
        {icon}
      </div>
      <div>
        <div style={{
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          marginBottom: '2px',
        }}>
          {label}
        </div>
        <div style={{
          fontSize: '1.5rem',
          fontWeight: 600,
          color: 'var(--text-primary)',
        }}>
          {value}
        </div>
      </div>
    </div>
  );
}

function ShimmerCard() {
  return (
    <div style={{
      backgroundColor: 'var(--bg-card)',
      border: '1px solid var(--border-primary)',
      borderRadius: 'var(--radius-lg)',
      padding: 'var(--space-4)',
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-4)',
      flex: '1 1 200px',
    }}>
      <div style={{
        width: 48,
        height: 48,
        borderRadius: 'var(--radius-md)',
        background: 'linear-gradient(90deg, var(--bg-tertiary) 25%, var(--bg-secondary) 50%, var(--bg-tertiary) 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
      }} />
      <div style={{ flex: 1 }}>
        <div style={{
          width: '60%',
          height: 12,
          borderRadius: 4,
          marginBottom: 8,
          background: 'linear-gradient(90deg, var(--bg-tertiary) 25%, var(--bg-secondary) 50%, var(--bg-tertiary) 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s infinite',
        }} />
        <div style={{
          width: '40%',
          height: 24,
          borderRadius: 4,
          background: 'linear-gradient(90deg, var(--bg-tertiary) 25%, var(--bg-secondary) 50%, var(--bg-tertiary) 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s infinite',
        }} />
      </div>
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
