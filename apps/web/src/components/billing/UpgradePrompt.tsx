'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, X } from 'lucide-react';

interface UpgradePromptProps {
  feature: string;
  requiredPlan: 'pro' | 'practice';
  onDismiss: () => void;
  compact?: boolean;
}

export function UpgradePrompt({ feature, requiredPlan, onDismiss, compact }: UpgradePromptProps) {
  const router = useRouter();
  const planLabel = requiredPlan === 'pro' ? 'Pro' : 'Practice';

  useEffect(() => {
    if (compact) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDismiss();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onDismiss, compact]);

  if (compact) {
    return (
      <span
        onClick={() => router.push('/dashboard/billing')}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '4px 10px',
          background: 'rgba(20,184,166,0.1)',
          border: '1px solid var(--accent)',
          borderRadius: '20px',
          fontSize: '0.75rem',
          color: 'var(--accent)',
          cursor: 'pointer',
        }}
      >
        <Lock size={12} />
        {planLabel} feature
      </span>
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="upgrade-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onDismiss}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
        }}
      />

      {/* Card */}
      <div
        style={{
          position: 'relative',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--accent)',
          borderRadius: '12px',
          padding: '32px',
          maxWidth: '400px',
          width: '100%',
          textAlign: 'center',
        }}
      >
        <button
          onClick={onDismiss}
          aria-label="Close"
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <X size={18} />
        </button>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(20,184,166,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Lock size={28} style={{ color: 'var(--accent)' }} />
          </div>
        </div>

        <h2
          id="upgrade-title"
          style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '12px' }}
        >
          Upgrade Required
        </h2>

        <p
          style={{
            fontSize: '0.9rem',
            color: 'var(--text-secondary)',
            marginBottom: '24px',
            lineHeight: 1.6,
          }}
        >
          <strong style={{ color: 'var(--text-primary)' }}>{feature}</strong> is available on the{' '}
          <strong style={{ color: 'var(--accent)' }}>{planLabel}</strong> plan and above.
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            onClick={() => router.push('/dashboard/billing')}
            style={{
              padding: '10px 24px',
              background: 'var(--accent)',
              color: '#000',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
            }}
          >
            See Plans
          </button>
          <button
            onClick={onDismiss}
            style={{
              padding: '10px 24px',
              background: 'transparent',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-primary)',
              borderRadius: '8px',
              fontWeight: 500,
              fontSize: '0.875rem',
              cursor: 'pointer',
            }}
          >
            Not Now
          </button>
        </div>
      </div>
    </div>
  );
}
