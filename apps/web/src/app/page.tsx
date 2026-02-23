'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, FileText, TrendingUp, Check, ChevronDown, AlertCircle, Clock, FileX, Shield } from 'lucide-react';

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', minHeight: '100vh' }}>
      {/* 1. Navigation */}
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: 'rgba(14, 17, 23, 0.8)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--border-primary)',
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '1rem 2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '2rem',
          }}
        >
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent)' }}>PhysioLens</div>

          <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
            <button
              onClick={() => scrollToSection('features')}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '0.95rem',
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection('pricing')}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '0.95rem',
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
            >
              Pricing
            </button>
            <button
              onClick={() => scrollToSection('faq')}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '0.95rem',
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
            >
              FAQ
            </button>
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <a
              href="/login"
              style={{
                padding: '0.5rem 1.5rem',
                background: 'transparent',
                border: '1px solid var(--border-primary)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                fontSize: '0.9rem',
                textDecoration: 'none',
                transition: 'all 0.2s',
                display: 'inline-block',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--bg-card)';
                e.currentTarget.style.borderColor = 'var(--text-tertiary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = 'var(--border-primary)';
              }}
            >
              Sign In
            </a>
            <Link
              href="/sessions/new"
              style={{
                padding: '0.5rem 1.5rem',
                background: 'var(--accent)',
                border: 'none',
                borderRadius: '8px',
                color: '#000',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'all 0.2s',
                display: 'inline-block',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--accent-light)';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 0 24px rgba(14, 205, 186, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--accent)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              Start Free
            </Link>
          </div>
        </div>
      </nav>

      {/* 2. Hero Section */}
      <section
        style={{
          padding: '6rem 2rem',
          textAlign: 'center',
          background: 'radial-gradient(ellipse 60% 40% at 50% 0%, var(--accent-glow) 0%, transparent 70%)',
        }}
      >
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h1
            style={{
              fontSize: '3.5rem',
              fontWeight: 700,
              lineHeight: 1.1,
              marginBottom: '1.5rem',
              letterSpacing: '-0.04em',
            }}
          >
            Measure ROM in 90 seconds. Document in half the time.
          </h1>
          <p
            style={{
              fontSize: '1.25rem',
              color: 'var(--text-secondary)',
              marginBottom: '2.5rem',
              lineHeight: 1.6,
              maxWidth: '700px',
              margin: '0 auto 2.5rem',
            }}
          >
            Browser-based computer vision that measures joint range-of-motion and auto-generates clinical notes — no
            wearables, no calibration, no manual data entry.
          </p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '2rem', flexWrap: 'wrap' }}>
            <Link
              href="/sessions/new"
              style={{
                padding: '1rem 2.5rem',
                background: 'var(--accent)',
                border: 'none',
                borderRadius: '12px',
                color: '#000',
                cursor: 'pointer',
                fontSize: '1.1rem',
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'all 0.2s',
                display: 'inline-block',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--accent-light)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 0 32px rgba(14, 205, 186, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--accent)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              Start Free — No Card Required
            </Link>
            <button
              onClick={() => scrollToSection('features')}
              style={{
                padding: '1rem 2.5rem',
                background: 'transparent',
                border: '1px solid var(--border-primary)',
                borderRadius: '12px',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                fontSize: '1.1rem',
                fontWeight: 600,
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--bg-card)';
                e.currentTarget.style.borderColor = 'var(--text-tertiary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = 'var(--border-primary)';
              }}
            >
              See How It Works →
            </button>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            style={{
              display: 'inline-block',
              padding: '1.5rem 2rem',
              background: 'var(--bg-card)',
              border: '2px solid var(--border-accent)',
              borderRadius: '16px',
              fontFamily: 'var(--font-mono)',
              fontVariantNumeric: 'tabular-nums',
              fontSize: 'var(--font-readout-size)',
              fontWeight: 700,
              color: 'var(--accent)',
              letterSpacing: '-0.02em',
              boxShadow: '0 0 40px var(--accent-glow)',
            }}
          >
            127°
          </motion.div>
        </div>
      </section>

      {/* 4. Problem / Solution */}
      <section style={{ padding: '6rem 2rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '4rem' }}>
            {/* Problems */}
            <div>
              <h2 style={{ fontSize: '2rem', marginBottom: '2rem', color: 'var(--text-primary)' }}>
                Still stuck with paper?
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <AlertCircle size={24} style={{ color: 'var(--error)', flexShrink: 0, marginTop: '0.25rem' }} />
                  <div>
                    <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                      Manual goniometers
                    </h4>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      Unreliable inter-rater measurements, time-consuming, and subjective results
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <FileX size={24} style={{ color: 'var(--error)', flexShrink: 0, marginTop: '0.25rem' }} />
                  <div>
                    <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                      Hand-written notes
                    </h4>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      Copy to EHR doubles documentation time, typos and illegible handwriting compromise care
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <Clock size={24} style={{ color: 'var(--error)', flexShrink: 0, marginTop: '0.25rem' }} />
                  <div>
                    <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                      No objective baseline
                    </h4>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      Can&apos;t prove improvement to patients or insurance without consistent measurement
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <Shield size={24} style={{ color: 'var(--error)', flexShrink: 0, marginTop: '0.25rem' }} />
                  <div>
                    <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                      Insurance audits
                    </h4>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      No data trail means vulnerable to claim rejections and compliance issues
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Solutions */}
            <div>
              <h2 style={{ fontSize: '2rem', marginBottom: '2rem', color: 'var(--accent)' }}>
                PhysioLens fixes all of it
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <Check size={24} style={{ color: 'var(--success)', flexShrink: 0, marginTop: '0.25rem' }} />
                  <div>
                    <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                      Computer vision angles
                    </h4>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      Sub-5° accuracy on any joint in seconds, consistent across all clinicians
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <Check size={24} style={{ color: 'var(--success)', flexShrink: 0, marginTop: '0.25rem' }} />
                  <div>
                    <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                      AI-generated SOAP notes
                    </h4>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      Copy-paste ready clinical documentation in your standard format, exported to PDF
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <Check size={24} style={{ color: 'var(--success)', flexShrink: 0, marginTop: '0.25rem' }} />
                  <div>
                    <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                      Session-over-session trends
                    </h4>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      Visual progress charts show improvement, builds patient confidence and retention
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <Check size={24} style={{ color: 'var(--success)', flexShrink: 0, marginTop: '0.25rem' }} />
                  <div>
                    <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                      Audit-ready history
                    </h4>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      Every measurement logged with timestamp, confidence score, and exportable to CSV
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Feature Cards */}
      <section id="features" style={{ padding: '6rem 2rem', background: 'var(--bg-secondary)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2.5rem', textAlign: 'center', marginBottom: '3rem' }}>Core Features</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
            <motion.div
              whileHover={{ scale: 1.02, y: -4 }}
              style={{
                padding: '2.5rem',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-primary)',
                borderRadius: '16px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  margin: '0 auto 1.5rem',
                  background: 'var(--accent-glow)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Zap size={32} style={{ color: 'var(--accent)' }} />
              </div>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Instant Angles</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                Pose detection measures any joint in seconds with sub-5° accuracy. No wearables or calibration needed.
              </p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02, y: -4 }}
              style={{
                padding: '2.5rem',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-primary)',
                borderRadius: '16px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  margin: '0 auto 1.5rem',
                  background: 'var(--accent-glow)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FileText size={32} style={{ color: 'var(--accent)' }} />
              </div>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Auto Clinical Notes</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                AI generates SOAP-format notes from measurement data, fully editable and exports to professional PDFs.
              </p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02, y: -4 }}
              style={{
                padding: '2.5rem',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-primary)',
                borderRadius: '16px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  margin: '0 auto 1.5rem',
                  background: 'var(--accent-glow)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <TrendingUp size={32} style={{ color: 'var(--accent)' }} />
              </div>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Trend Analysis</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                Track ROM improvement over sessions with visual charts. Generate shareable patient progress reports.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 6. Pricing Table */}
      <section id="pricing" style={{ padding: '6rem 2rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2.5rem', textAlign: 'center', marginBottom: '1rem' }}>Simple, Transparent Pricing</h2>
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            All prices in NZD. Start free, upgrade anytime.
          </p>

          {/* Billing Toggle */}
          <div
            style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginBottom: '3rem' }}
          >
            <span style={{ color: billingPeriod === 'monthly' ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
              Monthly
            </span>
            <button
              onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'annual' : 'monthly')}
              style={{
                width: '60px',
                height: '32px',
                background: billingPeriod === 'annual' ? 'var(--accent)' : 'var(--bg-tertiary)',
                border: '1px solid var(--border-primary)',
                borderRadius: '16px',
                position: 'relative',
                cursor: 'pointer',
                transition: 'all 0.3s',
              }}
            >
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  background: '#fff',
                  borderRadius: '50%',
                  position: 'absolute',
                  top: '3px',
                  left: billingPeriod === 'annual' ? '32px' : '3px',
                  transition: 'left 0.3s',
                }}
              />
            </button>
            <span style={{ color: billingPeriod === 'annual' ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
              Annual
            </span>
            {billingPeriod === 'annual' && (
              <span
                style={{
                  padding: '4px 12px',
                  background: 'var(--accent-glow)',
                  color: 'var(--accent)',
                  borderRadius: '12px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                }}
              >
                Save 30%
              </span>
            )}
          </div>

          {/* Pricing Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            {/* Starter */}
            <div
              style={{
                padding: '2.5rem',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-primary)',
                borderRadius: '16px',
              }}
            >
              <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Starter</h3>
              <p style={{ color: 'var(--text-tertiary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Free</p>
              <div style={{ fontSize: '3rem', fontWeight: 700, marginBottom: '1.5rem' }}>
                $0<span style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--text-secondary)' }}>/month</span>
              </div>
              <ul style={{ listStyle: 'none', marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <li style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                  <Check size={20} style={{ color: 'var(--success)', flexShrink: 0, marginTop: '0.15rem' }} />
                  <span style={{ color: 'var(--text-secondary)' }}>10 sessions/month</span>
                </li>
                <li style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                  <Check size={20} style={{ color: 'var(--success)', flexShrink: 0, marginTop: '0.15rem' }} />
                  <span style={{ color: 'var(--text-secondary)' }}>1 seat</span>
                </li>
                <li style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                  <Check size={20} style={{ color: 'var(--success)', flexShrink: 0, marginTop: '0.15rem' }} />
                  <span style={{ color: 'var(--text-secondary)' }}>Basic ROM measurement</span>
                </li>
                <li style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                  <Check size={20} style={{ color: 'var(--success)', flexShrink: 0, marginTop: '0.15rem' }} />
                  <span style={{ color: 'var(--text-secondary)' }}>Watermarked PDF exports</span>
                </li>
              </ul>
              <Link
                href="/sessions/new"
                style={{
                  display: 'block',
                  padding: '0.75rem',
                  background: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '8px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--bg-card-hover)';
                  e.currentTarget.style.borderColor = 'var(--text-tertiary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--bg-tertiary)';
                  e.currentTarget.style.borderColor = 'var(--border-primary)';
                }}
              >
                Start Free
              </Link>
            </div>

            {/* Clinician (Pro) */}
            <div
              style={{
                padding: '2.5rem',
                background: 'var(--bg-card)',
                border: '2px solid var(--border-accent)',
                borderRadius: '16px',
                position: 'relative',
                boxShadow: '0 0 40px rgba(14, 205, 186, 0.15)',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: '-12px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  padding: '4px 16px',
                  background: 'var(--accent)',
                  color: '#000',
                  borderRadius: '12px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Most Popular
              </div>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Clinician</h3>
              <p style={{ color: 'var(--text-tertiary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Pro</p>
              <div style={{ fontSize: '3rem', fontWeight: 700, marginBottom: '1.5rem' }}>
                ${billingPeriod === 'monthly' ? '49' : '34'}
                <span style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--text-secondary)' }}>/month</span>
              </div>
              {billingPeriod === 'annual' && (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', marginBottom: '1rem' }}>
                  Billed annually at $408/year
                </p>
              )}
              <ul style={{ listStyle: 'none', marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <li style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                  <Check size={20} style={{ color: 'var(--success)', flexShrink: 0, marginTop: '0.15rem' }} />
                  <span style={{ color: 'var(--text-secondary)' }}>Unlimited sessions</span>
                </li>
                <li style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                  <Check size={20} style={{ color: 'var(--success)', flexShrink: 0, marginTop: '0.15rem' }} />
                  <span style={{ color: 'var(--text-secondary)' }}>1 seat</span>
                </li>
                <li style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                  <Check size={20} style={{ color: 'var(--success)', flexShrink: 0, marginTop: '0.15rem' }} />
                  <span style={{ color: 'var(--text-secondary)' }}>AI clinical notes</span>
                </li>
                <li style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                  <Check size={20} style={{ color: 'var(--success)', flexShrink: 0, marginTop: '0.15rem' }} />
                  <span style={{ color: 'var(--text-secondary)' }}>90-day history</span>
                </li>
                <li style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                  <Check size={20} style={{ color: 'var(--success)', flexShrink: 0, marginTop: '0.15rem' }} />
                  <span style={{ color: 'var(--text-secondary)' }}>PDF without watermark</span>
                </li>
              </ul>
              <Link
                href="/sessions/new"
                style={{
                  display: 'block',
                  padding: '0.75rem',
                  background: 'var(--accent)',
                  color: '#000',
                  border: 'none',
                  borderRadius: '8px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--accent-light)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 0 24px rgba(14, 205, 186, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--accent)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                Start Free Trial
              </Link>
            </div>

            {/* Practice */}
            <div
              style={{
                padding: '2.5rem',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-primary)',
                borderRadius: '16px',
              }}
            >
              <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Practice</h3>
              <p style={{ color: 'var(--text-tertiary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Enterprise</p>
              <div style={{ fontSize: '3rem', fontWeight: 700, marginBottom: '1.5rem' }}>
                ${billingPeriod === 'monthly' ? '129' : '91'}
                <span style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--text-secondary)' }}>/month</span>
              </div>
              {billingPeriod === 'annual' && (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', marginBottom: '1rem' }}>
                  Billed annually at $1,092/year
                </p>
              )}
              <ul style={{ listStyle: 'none', marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <li style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                  <Check size={20} style={{ color: 'var(--success)', flexShrink: 0, marginTop: '0.15rem' }} />
                  <span style={{ color: 'var(--text-secondary)' }}>Up to 8 seats</span>
                </li>
                <li style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                  <Check size={20} style={{ color: 'var(--success)', flexShrink: 0, marginTop: '0.15rem' }} />
                  <span style={{ color: 'var(--text-secondary)' }}>Everything in Pro</span>
                </li>
                <li style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                  <Check size={20} style={{ color: 'var(--success)', flexShrink: 0, marginTop: '0.15rem' }} />
                  <span style={{ color: 'var(--text-secondary)' }}>Clinic admin dashboard</span>
                </li>
                <li style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                  <Check size={20} style={{ color: 'var(--success)', flexShrink: 0, marginTop: '0.15rem' }} />
                  <span style={{ color: 'var(--text-secondary)' }}>Patient home assessment portal</span>
                </li>
                <li style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                  <Check size={20} style={{ color: 'var(--success)', flexShrink: 0, marginTop: '0.15rem' }} />
                  <span style={{ color: 'var(--text-secondary)' }}>CSV data export</span>
                </li>
              </ul>
              <button
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '8px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: 600,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--bg-card-hover)';
                  e.currentTarget.style.borderColor = 'var(--text-tertiary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--bg-tertiary)';
                  e.currentTarget.style.borderColor = 'var(--border-primary)';
                }}
              >
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FAQ Accordion */}
      <section id="faq" style={{ padding: '6rem 2rem', background: 'var(--bg-secondary)' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2.5rem', textAlign: 'center', marginBottom: '3rem' }}>Frequently Asked Questions</h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              {
                q: 'Is PhysioLens HIPAA/HITECH compliant?',
                a: 'Yes. All data is encrypted at rest and in transit. We offer BAA agreements on Practice plans and above.',
              },
              {
                q: 'Does it work on any device?',
                a: 'PhysioLens runs in any modern browser — Chrome, Safari, Firefox, Edge. No app download required.',
              },
              {
                q: 'How accurate is the ROM measurement?',
                a: 'Our CV pipeline achieves sub-5° accuracy on major joints. Each measurement includes a confidence score.',
              },
              {
                q: 'Can I export data for insurance audits?',
                a: 'Pro and Practice plans include PDF export and CSV data export for audit trail.',
              },
              {
                q: 'What joints can PhysioLens measure?',
                a: 'Shoulder (flexion/abduction/rotation), elbow, wrist, hip, knee, ankle, and cervical spine. More joints added regularly.',
              },
              {
                q: 'Is there a free trial?',
                a: 'Yes — start for free with 10 sessions/month, no credit card required. Upgrade anytime.',
              },
            ].map((faq, idx) => (
              <div
                key={idx}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '12px',
                  overflow: 'hidden',
                }}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  style={{
                    width: '100%',
                    padding: '1.5rem',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    textAlign: 'left',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  {faq.q}
                  <ChevronDown
                    size={20}
                    style={{
                      transform: openFaq === idx ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.3s',
                    }}
                  />
                </button>
                <AnimatePresence>
                  {openFaq === idx && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div style={{ padding: '0 1.5rem 1.5rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Footer */}
      <footer style={{ padding: '4rem 2rem 2rem', background: 'var(--bg-primary)', borderTop: '1px solid var(--border-primary)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '3rem', marginBottom: '3rem' }}>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent)', marginBottom: '1rem' }}>
                PhysioLens
              </div>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '0.95rem' }}>
                AI-powered ROM measurement for physiotherapists
              </p>
            </div>

            <div>
              <h4 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Legal</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <a href="/privacy" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
                  Privacy Policy
                </a>
                <a href="/terms" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
                  Terms of Service
                </a>
                <a href="/medical-disclaimer" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
                  Medical Disclaimer
                </a>
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Contact</h4>
              <a href="mailto:support@physiolens.com" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
                support@physiolens.com
              </a>
            </div>
          </div>

          <div
            style={{
              paddingTop: '2rem',
              borderTop: '1px solid var(--border-primary)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              alignItems: 'center',
            }}
          >
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', textAlign: 'center' }}>
              © 2026 PhysioLens Ltd. All rights reserved.
            </p>
            <p
              style={{
                color: 'var(--text-muted)',
                fontSize: '0.8rem',
                textAlign: 'center',
                maxWidth: '600px',
                lineHeight: 1.6,
              }}
            >
              PhysioLens is a documentation tool and is not a medical device. Always exercise clinical judgment.
            </p>
          </div>
        </div>
      </footer>

      {/* JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'PhysioLens',
            applicationCategory: 'HealthApplication',
            offers: { '@type': 'AggregateOffer', lowPrice: '0', highPrice: '129', priceCurrency: 'NZD' },
            operatingSystem: 'Web Browser',
            description: 'AI-powered ROM measurement tool for physiotherapists',
          }),
        }}
      />
    </div>
  );
}
