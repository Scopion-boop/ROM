import Link from 'next/link';
import { FileQuestion, Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
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
            background: 'var(--bg-card)',
            border: '1px solid var(--border-primary)',
            borderRadius: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          <FileQuestion size={48} style={{ color: 'var(--accent)', opacity: 0.9 }} />
          {/* Small badge showing 404 */}
          <div
            style={{
              position: 'absolute',
              top: '-10px',
              right: '-10px',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-primary)',
              borderRadius: '8px',
              padding: '2px 8px',
              fontSize: '0.7rem',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-tertiary)',
              letterSpacing: '0.05em',
            }}
          >
            404
          </div>
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
          Page not found
        </h1>

        {/* Description */}
        <p
          style={{
            fontSize: '0.95rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.7,
            marginBottom: '2.5rem',
          }}
        >
          The page you&apos;re looking for doesn&apos;t exist or may have been moved. Check the URL
          or return to the dashboard.
        </p>

        {/* Actions */}
        <div
          style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          <Link
            href="/dashboard"
            className="btn btn-primary btn-lg"
            style={{ textDecoration: 'none' }}
          >
            <Home size={18} />
            Go to Dashboard
          </Link>
          <Link href="/" className="btn btn-secondary btn-lg" style={{ textDecoration: 'none' }}>
            <ArrowLeft size={18} />
            Back to Home
          </Link>
        </div>

        {/* Subtle brand footer */}
        <p
          style={{
            marginTop: '3rem',
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
