'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    Activity,
    ArrowRight,
    ArrowUpRight,
    BarChart3,
    CheckCircle2,
    Clock,
    FileText,
    FolderOpen,
    Layers,
    Plus,
    Shield,
    Sparkles,
    TrendingUp,
    Users,
    Zap,
} from 'lucide-react';

/* ── animation variants ── */
const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
    }),
};

const scaleIn = {
    hidden: { opacity: 0, scale: 0.92 },
    visible: (i: number) => ({
        opacity: 1,
        scale: 1,
        transition: { delay: i * 0.1, duration: 0.45, ease: [0.16, 1, 0.3, 1] as const },
    }),
};

/* ── mock data ── */
const STATS = [
    { label: 'Total Sessions', value: '1,284', change: '+12%', icon: FolderOpen, accent: false },
    { label: 'Measurements', value: '8,462', change: '+8.3%', icon: Activity, accent: true },
    { label: 'Patients', value: '312', change: '+5', icon: Users, accent: false },
    { label: 'Avg Confidence', value: '94.2%', change: '+1.4%', icon: TrendingUp, accent: false },
];

const RECENT_SESSIONS = [
    { id: 'SES-2841', patient: 'A. Rodriguez', joint: 'Right Shoulder', date: 'Today, 2:14 pm', status: 'complete' },
    { id: 'SES-2840', patient: 'M. Patel', joint: 'Left Knee', date: 'Today, 11:42 am', status: 'complete' },
    { id: 'SES-2839', patient: 'J. Thompson', joint: 'Cervical Spine', date: 'Yesterday', status: 'draft' },
    { id: 'SES-2838', patient: 'S. Kim', joint: 'Right Elbow', date: 'Yesterday', status: 'complete' },
    { id: 'SES-2837', patient: 'L. Nguyen', joint: 'Left Hip', date: '2 days ago', status: 'complete' },
];

const QUICK_ACTIONS = [
    { label: 'New Session', desc: 'Start a ROM measurement', href: '/sessions/new', icon: Plus, primary: true },
    { label: 'Browse Sessions', desc: 'View session history', href: '#', icon: FolderOpen, primary: false },
    { label: 'View Reports', desc: 'Analytics & exports', href: '#', icon: BarChart3, primary: false },
    { label: 'Compliance', desc: 'Audit & HIPAA status', href: '#', icon: Shield, primary: false },
];

const FEATURES = [
    {
        icon: Sparkles,
        title: 'AI-Powered Measurement',
        desc: 'Computer vision automatically calculates joint angles from video in real time.',
    },
    {
        icon: Layers,
        title: 'Multi-Joint Support',
        desc: '12 anatomical regions with standardised ROM protocols and normative ranges.',
    },
    {
        icon: FileText,
        title: 'Auto-Generated Notes',
        desc: 'NLP service drafts structured clinical notes from measurement data instantly.',
    },
    {
        icon: Shield,
        title: 'HIPAA-Ready',
        desc: 'Encryption at rest & in transit, RBAC, full audit trail, PHI safeguards.',
    },
];

type HealthStatus = 'ok' | 'down' | 'loading';

function healthColor(status: HealthStatus) {
    if (status === 'ok') return 'var(--success)';
    if (status === 'down') return 'var(--error)';
    return 'var(--text-tertiary)';
}

function healthDot(status: HealthStatus) {
    if (status === 'ok') return 'var(--success)';
    if (status === 'down') return 'var(--error)';
    return 'var(--text-muted)';
}

function healthLabel(status: HealthStatus) {
    if (status === 'ok') return 'Online';
    if (status === 'down') return 'Offline';
    return 'Checking…';
}

export default function HomePage() {
    const [apiHealth, setApiHealth] = useState<HealthStatus>('loading');

    useEffect(() => {
        fetch('http://localhost:4000/health')
            .then((r) => (r.ok ? setApiHealth('ok') : setApiHealth('down')))
            .catch(() => setApiHealth('down'));
    }, []);

    return (
        <main style={{ maxWidth: 1280, margin: '0 auto' }}>
            {/* ── Hero ── */}
            <motion.section
                initial="hidden"
                animate="visible"
                style={{ marginBottom: 48 }}
            >
                <motion.div
                    custom={0}
                    variants={fadeUp}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}
                >
                    <span
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '4px 12px',
                            borderRadius: 9999,
                            background: 'var(--accent-glow)',
                            border: '1px solid var(--border-accent)',
                            fontSize: 13,
                            color: 'var(--accent-light)',
                            fontWeight: 500,
                        }}
                    >
                        <Zap size={13} /> Platform v1.0 — Pilot Ready
                    </span>
                </motion.div>

                <motion.h1
                    custom={1}
                    variants={fadeUp}
                    style={{ fontSize: '2.8rem', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: 12 }}
                >
                    Clinical ROM
                    <br />
                    <span style={{ color: 'var(--accent)' }}>Measurement Platform</span>
                </motion.h1>

                <motion.p
                    custom={2}
                    variants={fadeUp}
                    style={{ color: 'var(--text-secondary)', fontSize: 17, maxWidth: 520, lineHeight: 1.7, marginBottom: 24 }}
                >
                    AI-powered musculoskeletal range-of-motion assessment.
                    Capture, measure, document — in one streamlined workflow.
                </motion.p>

                <motion.div custom={3} variants={fadeUp} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <Link href="/sessions/new" className="btn-primary btn-lg" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        <Plus size={18} /> New Session <ArrowRight size={16} />
                    </Link>

                    <span
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            fontSize: 13,
                            color: healthColor(apiHealth),
                        }}
                    >
                        <span
                            style={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                background: healthDot(apiHealth),
                                boxShadow: apiHealth === 'ok' ? '0 0 8px var(--success)' : 'none',
                            }}
                        />
                        API {healthLabel(apiHealth)}
                    </span>
                </motion.div>
            </motion.section>

            {/* ── Stat Cards ── */}
            <motion.section
                initial="hidden"
                animate="visible"
                style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px,1fr))', gap: 16, marginBottom: 48 }}
            >
                {STATS.map((s, i) => (
                    <motion.div
                        key={s.label}
                        custom={i}
                        variants={scaleIn}
                        className="card"
                        style={{
                            padding: 24,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 12,
                            position: 'relative',
                            overflow: 'hidden',
                        }}
                    >
                        {s.accent && (
                            <div
                                style={{
                                    position: 'absolute',
                                    top: -30,
                                    right: -30,
                                    width: 100,
                                    height: 100,
                                    borderRadius: '50%',
                                    background: 'var(--accent-glow)',
                                    filter: 'blur(30px)',
                                }}
                            />
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: 40,
                                    height: 40,
                                    borderRadius: 10,
                                    background: s.accent ? 'var(--accent-glow)' : 'var(--bg-tertiary)',
                                    color: s.accent ? 'var(--accent)' : 'var(--text-secondary)',
                                }}
                            >
                                <s.icon size={20} />
                            </span>
                            <span
                                style={{
                                    fontSize: 12,
                                    fontWeight: 600,
                                    color: 'var(--success)',
                                    background: 'rgba(34,197,94,0.1)',
                                    padding: '2px 8px',
                                    borderRadius: 999,
                                }}
                            >
                                {s.change}
                            </span>
                        </div>
                        <div>
                            <div
                                style={{
                                    fontSize: 30,
                                    fontWeight: 700,
                                    letterSpacing: '-0.03em',
                                    lineHeight: 1.1,
                                }}
                            >
                                {s.value}
                            </div>
                            <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 2 }}>
                                {s.label}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </motion.section>

            {/* ── Quick Actions + Recent Sessions grid ── */}
            <motion.section
                initial="hidden"
                animate="visible"
                style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 24, marginBottom: 48 }}
            >
                {/* Quick Actions */}
                <motion.div custom={0} variants={fadeUp}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: 'var(--text-secondary)' }}>
                        Quick Actions
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {QUICK_ACTIONS.map((a, i) => (
                            <motion.div key={a.label} custom={i + 1} variants={fadeUp}>
                                <Link
                                    href={a.href}
                                    className={a.primary ? 'card glow-border' : 'card'}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 14,
                                        padding: '16px 18px',
                                        textDecoration: 'none',
                                        color: 'inherit',
                                        transition: 'transform 200ms, background 200ms',
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
                                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                                >
                                    <span
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            width: 40,
                                            height: 40,
                                            borderRadius: 10,
                                            background: a.primary ? 'var(--accent)' : 'var(--bg-tertiary)',
                                            color: a.primary ? '#fff' : 'var(--text-secondary)',
                                            flexShrink: 0,
                                        }}
                                    >
                                        <a.icon size={18} />
                                    </span>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 600, fontSize: 14, lineHeight: 1.3 }}>{a.label}</div>
                                        <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{a.desc}</div>
                                    </div>
                                    <ArrowUpRight size={16} style={{ color: 'var(--text-muted)' }} />
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Recent Sessions Table */}
                <motion.div custom={1} variants={fadeUp}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-secondary)' }}>Recent Sessions</h3>
                        <Link
                            href="#"
                            style={{
                                fontSize: 13,
                                color: 'var(--accent)',
                                textDecoration: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                fontWeight: 500,
                            }}
                        >
                            View all <ArrowRight size={14} />
                        </Link>
                    </div>

                    <div className="card" style={{ overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    {['Session', 'Patient', 'Joint', 'Date', 'Status'].map((h) => (
                                        <th
                                            key={h}
                                            style={{
                                                textAlign: 'left',
                                                padding: '12px 16px',
                                                fontSize: 12,
                                                fontWeight: 600,
                                                color: 'var(--text-muted)',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.05em',
                                                borderBottom: '1px solid var(--border-primary)',
                                            }}
                                        >
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {RECENT_SESSIONS.map((s, i) => (
                                    <motion.tr
                                        key={s.id}
                                        custom={i}
                                        variants={{
                                            hidden: { opacity: 0 },
                                            visible: (j: number) => ({
                                                opacity: 1,
                                                transition: { delay: 0.4 + j * 0.06 },
                                            }),
                                        }}
                                        initial="hidden"
                                        animate="visible"
                                        style={{
                                            borderBottom: i < RECENT_SESSIONS.length - 1 ? '1px solid var(--border-secondary)' : 'none',
                                            cursor: 'pointer',
                                        }}
                                        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
                                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                                    >
                                        <td style={{ padding: '12px 16px', fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                                            {s.id}
                                        </td>
                                        <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 500 }}>{s.patient}</td>
                                        <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-secondary)' }}>{s.joint}</td>
                                        <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-tertiary)' }}>
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                                <Clock size={12} /> {s.date}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px 16px' }}>
                                            <span
                                                className={s.status === 'complete' ? 'badge-success' : 'badge'}
                                                style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: 4,
                                                    padding: '3px 10px',
                                                    borderRadius: 999,
                                                    fontSize: 12,
                                                    fontWeight: 500,
                                                    background:
                                                        s.status === 'complete'
                                                            ? 'rgba(34,197,94,0.12)'
                                                            : 'rgba(234,179,8,0.12)',
                                                    color: s.status === 'complete' ? 'var(--success)' : 'var(--warning)',
                                                }}
                                            >
                                                {s.status === 'complete' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                                                {s.status === 'complete' ? 'Complete' : 'Draft'}
                                            </span>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            </motion.section>

            {/* ── Platform Features ── */}
            <motion.section initial="hidden" animate="visible" style={{ marginBottom: 64 }}>
                <motion.h3
                    custom={0}
                    variants={fadeUp}
                    style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 16 }}
                >
                    Platform Capabilities
                </motion.h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(270px,1fr))', gap: 16 }}>
                    {FEATURES.map((f, i) => (
                        <motion.div
                            key={f.title}
                            custom={i + 1}
                            variants={scaleIn}
                            className="card"
                            style={{
                                padding: 24,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 12,
                                cursor: 'default',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = 'var(--border-accent)';
                                e.currentTarget.style.transform = 'translateY(-4px)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = 'var(--border-primary)';
                                e.currentTarget.style.transform = 'translateY(0)';
                            }}
                        >
                            <span
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: 44,
                                    height: 44,
                                    borderRadius: 12,
                                    background: 'var(--accent-glow)',
                                    color: 'var(--accent)',
                                }}
                            >
                                <f.icon size={22} />
                            </span>
                            <h4 style={{ fontSize: 15, fontWeight: 600 }}>{f.title}</h4>
                            <p style={{ fontSize: 13, color: 'var(--text-tertiary)', lineHeight: 1.6 }}>{f.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </motion.section>

            {/* ── Footer accent line ── */}
            <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 1.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                style={{
                    height: 2,
                    background: 'linear-gradient(90deg, transparent, var(--accent), transparent)',
                    borderRadius: 999,
                    marginBottom: 24,
                }}
            />
            <p
                style={{
                    textAlign: 'center',
                    fontSize: 12,
                    color: 'var(--text-muted)',
                    paddingBottom: 32,
                }}
            >
                ROM Platform v1.0 — Built for clinical excellence
            </p>
        </main>
    );
}
