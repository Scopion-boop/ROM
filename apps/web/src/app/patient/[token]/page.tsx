/**
 * /patient/[token] - Patient self-assessment portal page.
 *
 * Full-screen page for patients to complete ROM assessments
 * via a secure, tokenized link sent by their physiotherapist.
 * No sidebar or app layout - standalone patient experience.
 */

'use client';

import { useState, useEffect, use } from 'react';
import { HeartPulse } from 'lucide-react';

type PageStatus = 'loading' | 'valid' | 'invalid' | 'complete';
type Phase = 1 | 2 | 3;

interface LinkData {
  jointContext?: string;
}

export default function PatientPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);

  const [status, setStatus] = useState<PageStatus>('loading');
  const [linkData, setLinkData] = useState<LinkData | null>(null);
  const [phase, setPhase] = useState<Phase>(1);
  const [_cameraActive, setCameraActive] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const validateToken = async () => {
      try {
        const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
        const res = await fetch(`${API}/api/patient-links/${token}`);
        if (res.ok) {
          setLinkData(await res.json());
          setStatus('valid');
        } else {
          setStatus('invalid');
        }
      } catch {
        setStatus('invalid');
      }
    };

    validateToken();
  }, [token]);

  const handleSubmitMeasurement = async () => {
    setSubmitting(true);
    try {
      const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      await fetch(`${API}/api/patient-links/${token}/measurement`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ measurements: [], completedAt: new Date().toISOString() }),
      });
    } catch {
      // Silently handle error - still show completion
    }
    setSubmitting(false);
    setPhase(3);
  };

  // Loading state
  if (status === 'loading') {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--bg-primary)',
          color: 'var(--text-primary)',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'var(--font-sans, system-ui, sans-serif)',
        }}
      >
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              border: '3px solid var(--border-secondary)',
              borderTopColor: 'var(--accent)',
              borderRadius: 'var(--radius-full)',
              animation: 'spin 1s linear infinite',
            }}
          />
          <style>{`
                        @keyframes spin {
                            to { transform: rotate(360deg); }
                        }
                    `}</style>
        </div>
        <Footer />
      </div>
    );
  }

  // Invalid state
  if (status === 'invalid') {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--bg-primary)',
          color: 'var(--text-primary)',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'var(--font-sans, system-ui, sans-serif)',
        }}
      >
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--space-4)',
          }}
        >
          <div
            style={{
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-8)',
              maxWidth: 400,
              textAlign: 'center',
              border: '1px solid var(--border-primary)',
            }}
          >
            <HeartPulse
              style={{
                width: 48,
                height: 48,
                color: 'var(--accent)',
                marginBottom: 'var(--space-4)',
              }}
            />
            <h1
              style={{
                fontSize: '1.25rem',
                fontWeight: 600,
                marginBottom: 'var(--space-3)',
                color: 'var(--text-primary)',
              }}
            >
              Link Expired or Invalid
            </h1>
            <p
              style={{
                color: 'var(--text-muted)',
                fontSize: '0.875rem',
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              This link has expired or is invalid. Contact your clinic for a new link.
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Valid state - Phase 1: Instructions
  if (phase === 1) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--bg-primary)',
          color: 'var(--text-primary)',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'var(--font-sans, system-ui, sans-serif)',
        }}
      >
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--space-6)',
          }}
        >
          <div style={{ maxWidth: 480, width: '100%', textAlign: 'center' }}>
            {/* Logo */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 'var(--space-2)',
                marginBottom: 'var(--space-6)',
              }}
            >
              <HeartPulse style={{ width: 32, height: 32, color: 'var(--accent)' }} />
              <span style={{ fontSize: '1.25rem', fontWeight: 600 }}>PhysioLens</span>
            </div>

            {/* Heading */}
            <h1
              style={{
                fontSize: '1.75rem',
                fontWeight: 700,
                marginBottom: 'var(--space-2)',
              }}
            >
              Home Assessment
            </h1>

            {/* Subheading */}
            <p
              style={{
                color: 'var(--text-secondary)',
                fontSize: '1rem',
                marginBottom: 'var(--space-6)',
              }}
            >
              {linkData?.jointContext
                ? `Measuring: ${linkData.jointContext}`
                : 'Guided movement assessment'}
            </p>

            {/* Instructions Card */}
            <div
              style={{
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-6)',
                textAlign: 'left',
                border: '1px solid var(--border-primary)',
                marginBottom: 'var(--space-6)',
              }}
            >
              <ol
                style={{
                  margin: 0,
                  padding: 0,
                  paddingLeft: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-3)',
                }}
              >
                <li
                  style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.5 }}
                >
                  Find a clear space 2 metres from your camera
                </li>
                <li
                  style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.5 }}
                >
                  Ensure good lighting so your body is clearly visible
                </li>
                <li
                  style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.5 }}
                >
                  Wear fitted clothing for accurate measurements
                </li>
                <li
                  style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.5 }}
                >
                  Follow the on-screen prompts to complete your assessment
                </li>
              </ol>
            </div>

            {/* Start Button */}
            <button
              onClick={() => {
                setCameraActive(true);
                setPhase(2);
              }}
              style={{
                width: '100%',
                background: 'var(--accent)',
                color: '#000',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-4)',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background 200ms',
              }}
            >
              Start Assessment
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Valid state - Phase 2: Assessment
  if (phase === 2) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--bg-primary)',
          color: 'var(--text-primary)',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'var(--font-sans, system-ui, sans-serif)',
        }}
      >
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: 'var(--space-6)',
          }}
        >
          <div style={{ maxWidth: 560, width: '100%' }}>
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                marginBottom: 'var(--space-4)',
              }}
            >
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--error)',
                  animation: 'pulse 2s infinite',
                }}
              />
              <span style={{ fontSize: '1.125rem', fontWeight: 600 }}>Recording...</span>
              <style>{`
                                @keyframes pulse {
                                    0%, 100% { opacity: 1; }
                                    50% { opacity: 0.5; }
                                }
                            `}</style>
            </div>

            {/* Camera Placeholder */}
            <div
              style={{
                height: 320,
                background: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-primary)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 'var(--space-6)',
              }}
            >
              <p
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: '1rem',
                  marginBottom: 'var(--space-2)',
                }}
              >
                Camera access required
              </p>
              <p
                style={{
                  color: 'var(--text-muted)',
                  fontSize: '0.75rem',
                  textAlign: 'center',
                  maxWidth: 280,
                }}
              >
                This would activate the camera for guided measurements in a real deployment
              </p>
            </div>

            {/* Complete Button */}
            <button
              onClick={handleSubmitMeasurement}
              disabled={submitting}
              style={{
                width: '100%',
                background: submitting ? 'var(--bg-tertiary)' : 'var(--accent)',
                color: submitting ? 'var(--text-muted)' : '#000',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-4)',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: submitting ? 'not-allowed' : 'pointer',
                transition: 'background 200ms',
                marginBottom: 'var(--space-4)',
              }}
            >
              {submitting ? 'Submitting...' : 'Complete Assessment'}
            </button>

            {/* Back Link */}
            <button
              onClick={() => {
                setCameraActive(false);
                setPhase(1);
              }}
              style={{
                width: '100%',
                background: 'transparent',
                color: 'var(--text-muted)',
                border: 'none',
                padding: 'var(--space-2)',
                fontSize: '0.875rem',
                cursor: 'pointer',
              }}
            >
              Back to instructions
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Valid state - Phase 3: Complete
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'var(--font-sans, system-ui, sans-serif)',
      }}
    >
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--space-6)',
        }}
      >
        <div style={{ maxWidth: 400, width: '100%', textAlign: 'center' }}>
          {/* Checkmark Circle */}
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: 'var(--radius-full)',
              background: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto',
              marginBottom: 'var(--space-6)',
            }}
          >
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fff"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          {/* Heading */}
          <h1
            style={{
              fontSize: '1.75rem',
              fontWeight: 700,
              marginBottom: 'var(--space-3)',
            }}
          >
            Assessment Complete
          </h1>

          {/* Body */}
          <p
            style={{
              color: 'var(--text-secondary)',
              fontSize: '1rem',
              lineHeight: 1.6,
              marginBottom: 'var(--space-8)',
            }}
          >
            Thank you! Your physiotherapist will review your results and be in touch.
          </p>

          {/* Powered by Link */}
          <a
            href="https://physiolens.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              color: 'var(--text-muted)',
              textDecoration: 'none',
              fontSize: '0.875rem',
            }}
          >
            <HeartPulse style={{ width: 16, height: 16, color: 'var(--accent)' }} />
            Powered by PhysioLens
          </a>
        </div>
      </div>
      <Footer />
    </div>
  );
}

function Footer() {
  return (
    <footer
      style={{
        marginTop: 'auto',
        padding: 'var(--space-6)',
        textAlign: 'center',
        fontSize: '0.75rem',
        color: 'var(--text-muted)',
      }}
    >
      Powered by <span style={{ color: 'var(--accent)' }}>PhysioLens</span> — Secure clinical
      assessment platform
    </footer>
  );
}
