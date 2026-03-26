'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Log to console for debugging — replace with a proper error reporting
    // service (e.g. Sentry) if one is added later.
    console.error('[PhysioLens] Unhandled error:', error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}
    >
      <div
        className="animate-fade-in"
        style={{
          maxWidth: '480px',
          width: '100%',
          textAlign: 'center',
        }}
      >
        {/* Icon illustration */}
        <div
          style={{
            width: '96px',
            height: '96px',
            margin: '0 auto 2rem',
            background: 'rgba(248, 113, 113, 0.05)',
            border: '1px solid rgba(248, 113, 113, 0.2)',
            borderRadius: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <AlertTriangle size={48} style={{ color: 'var(--error)', opacity: 0.9 }} />
        </div>

        {/* Heading */}
        <h1
          style={{
            fontSize: '1.75rem',
            fontWeight: 700,
            letterSpacing: '-0.04em',
            marginBottom: '0.75rem',
            color: 'var(--text-primary)',
          }}
        >
          Something went wrong
        </h1>

        {/* Description */}
        <p
          style={{
            fontSize: '0.95rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.7,
            marginBottom: '0.75rem',
          }}
        >
          An unexpected error occurred. You can try again or return to the dashboard.
        </p>

        {/* Error detail — shown only when a message is available */}
        {error.message && (
          <div
            style={{
              padding: '0.75rem 1rem',
              marginBottom: '2rem',
              background: 'rgba(248, 113, 113, 0.06)',
              border: '1px solid rgba(248, 113, 113, 0.15)',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-tertiary)',
              textAlign: 'left',
              wordBreak: 'break-word',
              lineHeight: 1.6,
            }}
          >
            {error.message}
          </div>
        )}

        {!error.message && <div style={{ marginBottom: '2rem' }} />}

        {/* Actions */}
        <div
          style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          <button onClick={reset} className="btn btn-primary btn-lg" type="button">
            <RefreshCw size={18} />
            Try again
          </button>
          <Link
            href="/dashboard"
            className="btn btn-secondary btn-lg"
            style={{ textDecoration: 'none' }}
          >
            <Home size={18} />
            Go to Dashboard
          </Link>
        </div>

        {/* Digest for support reference */}
        {error.digest && (
          <p
            style={{
              marginTop: '2rem',
              fontSize: '0.75rem',
              color: 'var(--text-tertiary)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            Error ID: {error.digest}
          </p>
        )}

        {/* Subtle brand footer */}
        <p
          style={{
            marginTop: error.digest ? '1rem' : '3rem',
            fontSize: '0.8rem',
            color: 'var(--text-tertiary)',
          }}
        >
          <span style={{ color: 'var(--accent)', fontWeight: 600 }}>PhysioLens</span> — AI-powered
          ROM measurement
        </p>
      </div>
    </div>
  );
}
