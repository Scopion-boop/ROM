'use client';
import { useState, useEffect } from 'react';
import { CreditCard, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { usePlan } from '@/lib/plan-context';

interface Subscription {
  plan: 'free' | 'pro';
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete';
  currentPeriodEnd: string | null;
  trialEnd: string | null;
  sessionsThisMonth: number;
  sessionLimit: number | null;
}

const PLAN_LABELS: Record<string, string> = { free: 'FREE PLAN', pro: 'PRO PLAN' };
const PLAN_COLORS: Record<string, string> = { free: 'var(--text-muted)', pro: 'var(--accent)' };
const STATUS_COLORS: Record<string, string> = {
  active: 'var(--success)',
  trialing: 'var(--accent)',
  past_due: 'var(--warning)',
  canceled: 'var(--error)',
  incomplete: 'var(--warning)',
};

export default function BillingPage() {
  const { refresh } = usePlan();
  const [sub, setSub] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function fetchSub() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${authClient.apiUrl}/api/billing/subscription`, {
        headers: authClient.getAuthHeaders(),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch');
      setSub(await res.json());
    } catch {
      setError('Failed to load billing info. Try again.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSub();
  }, []);

  async function handleUpgrade() {
    setActionLoading(true);
    setError(null);
    try {
      const res = await fetch(`${authClient.apiUrl}/api/billing/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authClient.getAuthHeaders() },
        credentials: 'include',
        body: JSON.stringify({
          priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID ?? 'price_pro_monthly',
        }),
      });
      const { checkoutUrl } = await res.json();
      if (checkoutUrl) window.location.href = checkoutUrl;
    } catch {
      setError('Failed to start checkout. Please try again.');
    } finally {
      setActionLoading(false);
    }
  }

  async function handlePortal() {
    setActionLoading(true);
    setError(null);
    try {
      const res = await fetch(`${authClient.apiUrl}/api/billing/portal`, {
        method: 'POST',
        headers: authClient.getAuthHeaders(),
        credentials: 'include',
      });
      const { portalUrl } = await res.json();
      if (portalUrl) window.location.href = portalUrl;
    } catch {
      setError('Failed to open billing portal. Please try again.');
    } finally {
      setActionLoading(false);
    }
  }

  const cardStyle: React.CSSProperties = {
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-primary)',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '16px',
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '24px' }}>
          Billing & Subscription
        </h1>
        {[1, 2].map((i) => (
          <div
            key={i}
            style={{
              ...cardStyle,
              height: '120px',
              background:
                'linear-gradient(90deg, var(--bg-secondary) 25%, var(--bg-tertiary) 50%, var(--bg-secondary) 75%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.5s infinite',
            }}
          />
        ))}
        <style>{`@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }`}</style>
      </div>
    );
  }

  if (error && !sub) {
    return (
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '24px' }}>
          Billing & Subscription
        </h1>
        <div
          style={{
            ...cardStyle,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: 'var(--error)',
          }}
        >
          <AlertCircle size={20} />
          <span style={{ flex: 1 }}>{error}</span>
          <button
            onClick={fetchSub}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-primary)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              fontSize: '0.875rem',
            }}
          >
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      </div>
    );
  }

  const plan = sub?.plan ?? 'free';
  const status = sub?.status ?? 'active';
  const sessions = sub?.sessionsThisMonth ?? 0;
  const limit = sub?.sessionLimit ?? 10;
  const usagePercent = sub?.sessionLimit ? Math.min(100, (sessions / limit) * 100) : 0;
  const statusColor = STATUS_COLORS[status] ?? 'var(--success)';
  const planColor = PLAN_COLORS[plan] ?? 'var(--text-muted)';

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <CreditCard size={24} style={{ color: 'var(--accent)' }} />
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Billing & Subscription</h1>
      </div>

      {error && (
        <div
          style={{
            padding: '12px 16px',
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: '8px',
            color: 'var(--error)',
            marginBottom: '16px',
            fontSize: '0.875rem',
          }}
        >
          {error}
        </div>
      )}

      {/* Plan card */}
      <div style={cardStyle}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px',
          }}
        >
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              color: planColor,
              padding: '4px 10px',
              border: `1px solid ${planColor}`,
              borderRadius: '20px',
            }}
          >
            {PLAN_LABELS[plan] ?? plan.toUpperCase()}
          </span>
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              padding: '4px 10px',
              borderRadius: '20px',
              background: `${statusColor}22`,
              color: statusColor,
              border: `1px solid ${statusColor}44`,
            }}
          >
            {status === 'trialing'
              ? 'Trial'
              : status.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
          </span>
        </div>

        {plan === 'free' ? (
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '8px',
                fontSize: '0.875rem',
              }}
            >
              <span style={{ color: 'var(--text-secondary)' }}>Sessions this month</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{sessions} / 10</span>
            </div>
            <div
              style={{
                height: '8px',
                background: 'var(--bg-tertiary)',
                borderRadius: '4px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${usagePercent}%`,
                  background: usagePercent >= 90 ? 'var(--error)' : 'var(--accent)',
                  borderRadius: '4px',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>
              {10 - sessions} sessions remaining this month
            </p>
          </div>
        ) : (
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success)' }}
          >
            <Check size={18} />
            <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Unlimited sessions</span>
          </div>
        )}

        {sub?.currentPeriodEnd && plan !== 'free' && (
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '16px' }}>
            Renews{' '}
            {new Date(sub.currentPeriodEnd).toLocaleDateString('en-NZ', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        )}
        {sub?.trialEnd && status === 'trialing' && (
          <p style={{ fontSize: '0.8rem', color: 'var(--accent)', marginTop: '8px' }}>
            Trial ends{' '}
            {new Date(sub.trialEnd).toLocaleDateString('en-NZ', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        )}
      </div>

      {/* Action card */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '12px' }}>
          {plan === 'free' ? 'Upgrade your plan' : 'Manage your subscription'}
        </h3>

        {plan === 'free' ? (
          <div>
            <p
              style={{
                fontSize: '0.875rem',
                color: 'var(--text-secondary)',
                marginBottom: '16px',
                lineHeight: 1.6,
              }}
            >
              Unlock unlimited sessions, AI-generated clinical notes, and watermark-free PDF
              exports.
            </p>
            <button
              onClick={handleUpgrade}
              disabled={actionLoading}
              style={{
                padding: '12px 24px',
                background: 'var(--accent)',
                color: '#000',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: actionLoading ? 'not-allowed' : 'pointer',
                opacity: actionLoading ? 0.7 : 1,
              }}
            >
              {actionLoading ? 'Loading...' : 'Upgrade to Pro — $49/month NZD'}
            </button>
          </div>
        ) : (
          <button
            onClick={handlePortal}
            disabled={actionLoading}
            style={{
              padding: '12px 24px',
              background: 'transparent',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-primary)',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: actionLoading ? 'not-allowed' : 'pointer',
              opacity: actionLoading ? 0.7 : 1,
            }}
          >
            {actionLoading ? 'Loading...' : 'Manage Subscription'}
          </button>
        )}
      </div>
    </div>
  );
}
