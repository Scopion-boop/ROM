'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ArrowRight } from 'lucide-react';
import { authClient } from '@/lib/auth-client';

type Step = 1 | 2 | 3;

const SPECIALTIES = [
  'Physiotherapist',
  'Sports Medicine',
  'Chiropractor',
  'Orthopaedic Surgeon',
  'Occupational Therapist',
  'Other',
];

const COUNTRIES = [
  'New Zealand',
  'Australia',
  'United Kingdom',
  'United States',
  'Canada',
  'Ireland',
  'South Africa',
  'Singapore',
  'India',
  'Other',
];

const USE_CASES = [
  'Individual practice',
  'Multi-clinician clinic',
  'Research / Education',
];

const PLAN_FEATURES = {
  free: ['10 sessions/month', '1 seat', 'Basic ROM measurement', 'Watermarked PDFs'],
  pro: ['Unlimited sessions', '1 seat', 'AI clinical notes', '90-day history', 'PDF without watermark'],
  practice: ['Up to 8 seats', 'Everything in Pro', 'Clinic admin dashboard', 'Patient assessment portal', 'CSV data export'],
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  background: 'var(--bg-tertiary)',
  border: '1px solid var(--border-primary)',
  borderRadius: '8px',
  color: 'var(--text-primary)',
  fontSize: '0.9rem',
  outline: 'none',
  boxSizing: 'border-box',
};

const btnPrimaryStyle: React.CSSProperties = {
  padding: '12px 28px',
  background: 'var(--accent)',
  color: '#000',
  border: 'none',
  borderRadius: '8px',
  fontWeight: 600,
  fontSize: '0.9rem',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
};

const btnGhostStyle: React.CSSProperties = {
  padding: '12px 28px',
  background: 'transparent',
  color: 'var(--text-secondary)',
  border: '1px solid var(--border-primary)',
  borderRadius: '8px',
  fontWeight: 500,
  fontSize: '0.9rem',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
};

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>(1);
  const [specialty, setSpecialty] = useState('');
  const [country, setCountry] = useState('');
  const [useCase, setUseCase] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 3: fire confetti + mark onboarding complete
  useEffect(() => {
    if (step !== 3) return;

    // Fire confetti
    import('canvas-confetti').then((m) => {
      const confetti = m.default;
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#0ECDBA', '#ffffff', '#0ECDBA'],
      });
    });

    // Mark onboarding complete
    fetch(`${authClient.apiUrl}/api/auth/me`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authClient.getAuthHeaders() },
      body: JSON.stringify({ onboardingCompleted: true }),
    }).catch(() => {/* non-critical */ });
  }, [step]);

  async function handleStep1() {
    setLoading(true);
    setError('');
    try {
      await fetch(`${authClient.apiUrl}/api/auth/me`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authClient.getAuthHeaders() },
        body: JSON.stringify({ specialty, country }),
      });
      setStep(2);
    } catch {
      setError('Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleProCheckout() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${authClient.apiUrl}/api/billing/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authClient.getAuthHeaders() },
        body: JSON.stringify({ priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID ?? 'price_pro_monthly' }),
      });
      const { checkoutUrl } = await res.json();
      if (checkoutUrl) window.location.href = checkoutUrl;
    } catch {
      setError('Failed to start checkout. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    background: 'var(--bg-primary)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
  };

  const cardStyle: React.CSSProperties = {
    background: 'var(--bg-secondary)',
    borderRadius: '16px',
    border: '1px solid var(--border-primary)',
    padding: '40px',
    width: '100%',
    maxWidth: '560px',
  };

  return (
    <div style={containerStyle}>
      {/* Logo */}
      <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--accent)', marginBottom: '32px' }}>
        PhysioLens
      </div>

      {/* Step indicators */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {([1, 2, 3] as Step[]).map((s) => (
          <div key={s} style={{ width: s === step ? '24px' : '8px', height: '8px', borderRadius: '4px', background: s === step ? 'var(--accent)' : s < step ? 'var(--accent)' : 'var(--border-primary)', transition: 'all 0.3s ease', opacity: s < step ? 0.5 : 1 }} />
        ))}
      </div>

      <div style={{ width: '100%', maxWidth: '560px' }}>
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} style={cardStyle}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Step 1 of 3</p>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '8px' }}>Tell us about your practice</h1>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '28px', fontSize: '0.95rem' }}>This helps us personalise your experience.</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '24px' }}>
                <div>
                  <label htmlFor="onboard-specialty" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Specialty</label>
                  <select id="onboard-specialty" value={specialty} onChange={(e) => setSpecialty(e.target.value)} style={{ ...inputStyle }}>
                    <option value="">Select your specialty</option>
                    {SPECIALTIES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div>
                  <label htmlFor="onboard-country" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Country</label>
                  <select id="onboard-country" value={country} onChange={(e) => setCountry(e.target.value)} style={inputStyle}>
                    <option value="">Select your country</option>
                    {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '10px' }}>Primary use case</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {USE_CASES.map((uc) => (
                      <label key={uc} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${useCase === uc ? 'var(--accent)' : 'var(--border-primary)'}`, background: useCase === uc ? 'rgba(14,205,186,0.08)' : 'var(--bg-tertiary)', cursor: 'pointer', transition: 'all 0.2s' }}>
                        <input type="radio" name="useCase" value={uc} checked={useCase === uc} onChange={() => setUseCase(uc)} style={{ accentColor: 'var(--accent)' }} />
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{uc}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {error && <p style={{ color: 'var(--error)', fontSize: '0.875rem', marginBottom: '16px' }}>{error}</p>}

              <button onClick={handleStep1} disabled={loading} style={{ ...btnPrimaryStyle, width: '100%', justifyContent: 'center', opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Saving...' : 'Continue'} <ArrowRight size={16} />
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} style={cardStyle}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Step 2 of 3</p>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '8px' }}>Start free, upgrade when ready</h1>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '28px', fontSize: '0.95rem' }}>No credit card required.</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                {/* Free */}
                <div style={{ padding: '20px', border: '1px solid var(--border-primary)', borderRadius: '12px', background: 'var(--bg-tertiary)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1rem' }}>Starter</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Free forever</div>
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>$0<span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--text-muted)' }}>/mo</span></div>
                  </div>
                  <ul style={{ listStyle: 'none', marginBottom: '16px' }}>
                    {PLAN_FEATURES.free.map((f) => <li key={f} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}><Check size={14} style={{ color: 'var(--success)', flexShrink: 0 }} />{f}</li>)}
                  </ul>
                  <button onClick={() => setStep(3)} style={{ ...btnGhostStyle, width: '100%', justifyContent: 'center' }}>Continue Free →</button>
                </div>

                {/* Pro */}
                <div style={{ padding: '20px', border: '2px solid var(--accent)', borderRadius: '12px', background: 'rgba(14,205,186,0.03)', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: '-11px', left: '20px', padding: '2px 12px', background: 'var(--accent)', color: '#000', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Most Popular</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1rem' }}>Clinician</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Pro plan</div>
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>$49<span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--text-muted)' }}>/mo NZD</span></div>
                  </div>
                  <ul style={{ listStyle: 'none', marginBottom: '16px' }}>
                    {PLAN_FEATURES.pro.map((f) => <li key={f} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}><Check size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />{f}</li>)}
                  </ul>
                  <button onClick={handleProCheckout} disabled={loading} style={{ ...btnPrimaryStyle, width: '100%', justifyContent: 'center', opacity: loading ? 0.7 : 1 }}>
                    {loading ? 'Loading...' : 'Start Free Trial'} <ArrowRight size={16} />
                  </button>
                </div>

                {/* Practice */}
                <div style={{ padding: '20px', border: '1px solid var(--border-primary)', borderRadius: '12px', background: 'var(--bg-tertiary)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1rem' }}>Practice</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Multi-clinician</div>
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>$129<span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--text-muted)' }}>/mo NZD</span></div>
                  </div>
                  <ul style={{ listStyle: 'none', marginBottom: '16px' }}>
                    {PLAN_FEATURES.practice.map((f) => <li key={f} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}><Check size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />{f}</li>)}
                  </ul>
                  <a href="mailto:sales@physiolens.io" style={{ ...btnGhostStyle, width: '100%', justifyContent: 'center', textDecoration: 'none', display: 'flex' }}>Contact Sales</a>
                </div>
              </div>

              {error && <p style={{ color: 'var(--error)', fontSize: '0.875rem' }}>{error}</p>}

              <button onClick={() => setStep(1)} style={{ ...btnGhostStyle, width: '100%', justifyContent: 'center', marginTop: '8px' }}>
                &larr; Back
              </button>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }} style={{ ...cardStyle, textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(14,205,186,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--accent)' }}>
                  <Check size={40} style={{ color: 'var(--accent)' }} />
                </div>
              </div>
              <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '12px' }}>You&apos;re ready to go!</h1>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', fontSize: '1rem', lineHeight: 1.6 }}>Your first ROM measurement is one click away.</p>
              <Link href="/sessions/new" style={{ ...btnPrimaryStyle, textDecoration: 'none', display: 'inline-flex', padding: '14px 32px', fontSize: '1rem' }}>
                Start First Session <ArrowRight size={18} />
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
