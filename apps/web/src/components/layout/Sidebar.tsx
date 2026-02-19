'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Activity,
    FolderOpen,
    FileText,
    Settings,
    Shield,
    ChevronLeft,
    ChevronRight,
    Search,
    Plus,
    LogOut,
    CreditCard,
    Building2,
} from 'lucide-react';
import { usePlan } from '@/lib/plan-context';

const NAV_ITEMS = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/sessions/new', label: 'New Session', icon: Plus },
    { href: '#', label: 'Sessions', icon: FolderOpen },
    { href: '#', label: 'Measurements', icon: Activity },
    { href: '#', label: 'Reports', icon: FileText },
    { href: '/dashboard/billing', label: 'Billing & Plan', icon: CreditCard },
];

const BOTTOM_NAV = [
    { href: '#', label: 'Compliance', icon: Shield },
    { href: '#', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);
    const { plan } = usePlan();

    return (
        <aside
            style={{
                width: collapsed ? 'var(--sidebar-collapsed)' : 'var(--sidebar-width)',
                height: '100vh',
                position: 'fixed',
                top: 0,
                left: 0,
                display: 'flex',
                flexDirection: 'column',
                background: 'var(--bg-secondary)',
                borderRight: '1px solid var(--border-primary)',
                transition: 'width var(--duration-normal) var(--ease-out)',
                zIndex: 50,
                overflow: 'hidden',
            }}
        >
            {/* Logo */}
            <div
                style={{
                    height: 'var(--header-height)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-3)',
                    padding: '0 var(--space-5)',
                    borderBottom: '1px solid var(--border-primary)',
                    flexShrink: 0,
                }}
            >
                <div
                    style={{
                        width: 36,
                        height: 36,
                        background: 'var(--bg-tertiary)',
                        border: '1px solid var(--border-primary)',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                    }}
                >
                    {/* Angle arc mark — goniometer reference */}
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 20 L20 20" stroke="var(--text-tertiary)" strokeWidth="1.5" strokeLinecap="round" />
                        <path d="M4 20 L16 6" stroke="var(--text-tertiary)" strokeWidth="1.5" strokeLinecap="round" />
                        <path d="M10 20 A6 6 0 0 1 12.4 14.4" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" fill="none" />
                        <circle cx="11.6" cy="16.2" r="1" fill="var(--accent)" />
                    </svg>
                </div>
                {!collapsed && (
                    <div style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: '1rem', fontWeight: 600, letterSpacing: '-0.02em' }}>
                            Physio<span style={{ fontWeight: 400, color: 'var(--text-secondary)' }}>Lens</span>
                        </span>
                    </div>
                )}
            </div>

            {/* Search (expanded only) */}
            {!collapsed && (
                <div style={{ padding: 'var(--space-4) var(--space-4) 0' }}>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-2)',
                            padding: 'var(--space-2) var(--space-3)',
                            background: 'var(--bg-tertiary)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-secondary)',
                            color: 'var(--text-muted)',
                            fontSize: '0.8125rem',
                        }}
                    >
                        <Search size={14} />
                        <span>Search...</span>
                        <kbd
                            style={{
                                marginLeft: 'auto',
                                fontSize: '0.6875rem',
                                padding: '1px 6px',
                                borderRadius: '4px',
                                background: 'var(--bg-primary)',
                                border: '1px solid var(--border-primary)',
                                color: 'var(--text-muted)',
                                fontFamily: 'var(--font-sans)',
                            }}
                        >
                            ⌘K
                        </kbd>
                    </div>
                </div>
            )}

            {/* Main Nav */}
            <nav style={{ flex: 1, padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: '2px', overflowY: 'auto' }}>
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', padding: collapsed ? '0' : 'var(--space-2) var(--space-3)', marginBottom: 'var(--space-1)' }}>
                    {!collapsed && 'Platform'}
                </div>
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href + item.label}
                            href={item.href}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--space-3)',
                                padding: collapsed ? 'var(--space-3)' : 'var(--space-2) var(--space-3)',
                                borderRadius: 'var(--radius-md)',
                                color: isActive ? 'var(--text-primary)' : 'var(--text-tertiary)',
                                background: isActive ? 'var(--bg-card-hover)' : 'transparent',
                                fontSize: '0.875rem',
                                fontWeight: isActive ? 500 : 400,
                                textDecoration: 'none',
                                transition: 'all var(--duration-fast) var(--ease-out)',
                                justifyContent: collapsed ? 'center' : 'flex-start',
                                position: 'relative',
                            }}
                            title={collapsed ? item.label : undefined}
                        >
                            {isActive && (
                                <div
                                    style={{
                                        position: 'absolute',
                                        left: 0,
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        width: 3,
                                        height: 16,
                                        background: 'var(--accent)',
                                        borderRadius: 'var(--radius-full)',
                                    }}
                                />
                            )}
                            <Icon size={18} strokeWidth={isActive ? 2 : 1.5} style={{ color: isActive ? 'var(--accent)' : undefined, flexShrink: 0 }} />
                            {!collapsed && <span>{item.label}</span>}
                        </Link>
                    );
                })}
                {plan === 'practice' && (() => {
                    const isActive = pathname === '/dashboard/clinic';
                    return (
                        <Link
                            href="/dashboard/clinic"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--space-3)',
                                padding: collapsed ? 'var(--space-3)' : 'var(--space-2) var(--space-3)',
                                borderRadius: 'var(--radius-md)',
                                color: isActive ? 'var(--text-primary)' : 'var(--text-tertiary)',
                                background: isActive ? 'var(--bg-card-hover)' : 'transparent',
                                fontSize: '0.875rem',
                                fontWeight: isActive ? 500 : 400,
                                textDecoration: 'none',
                                transition: 'all var(--duration-fast) var(--ease-out)',
                                justifyContent: collapsed ? 'center' : 'flex-start',
                                position: 'relative',
                            }}
                            title={collapsed ? 'Clinic' : undefined}
                        >
                            {isActive && (
                                <div
                                    style={{
                                        position: 'absolute',
                                        left: 0,
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        width: 3,
                                        height: 16,
                                        background: 'var(--accent)',
                                        borderRadius: 'var(--radius-full)',
                                    }}
                                />
                            )}
                            <Building2 size={18} strokeWidth={isActive ? 2 : 1.5} style={{ color: isActive ? 'var(--accent)' : undefined, flexShrink: 0 }} />
                            {!collapsed && <span>Clinic</span>}
                        </Link>
                    );
                })()}
            </nav>

            {/* Bottom Nav */}
            <div style={{ padding: 'var(--space-4)', borderTop: '1px solid var(--border-primary)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {BOTTOM_NAV.map((item) => {
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.label}
                            href={item.href}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--space-3)',
                                padding: collapsed ? 'var(--space-3)' : 'var(--space-2) var(--space-3)',
                                borderRadius: 'var(--radius-md)',
                                color: 'var(--text-tertiary)',
                                fontSize: '0.875rem',
                                textDecoration: 'none',
                                justifyContent: collapsed ? 'center' : 'flex-start',
                            }}
                            title={collapsed ? item.label : undefined}
                        >
                            <Icon size={18} strokeWidth={1.5} style={{ flexShrink: 0 }} />
                            {!collapsed && <span>{item.label}</span>}
                        </Link>
                    );
                })}

                {/* User */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-3)',
                        padding: 'var(--space-3)',
                        marginTop: 'var(--space-2)',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--bg-tertiary)',
                        justifyContent: collapsed ? 'center' : 'flex-start',
                    }}
                >
                    <div
                        style={{
                            width: 32,
                            height: 32,
                            borderRadius: 'var(--radius-full)',
                            background: 'linear-gradient(135deg, var(--accent-dark), var(--accent))',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: '#000',
                            flexShrink: 0,
                        }}
                    >
                        DC
                    </div>
                    {!collapsed && (
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                            <div style={{ fontSize: '0.8125rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                Dr. Chan
                            </div>
                            <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                                Clinician
                            </div>
                        </div>
                    )}
                    {!collapsed && (
                        <span style={{
                            padding: '2px 6px',
                            background: plan === 'pro'
                                ? 'rgba(20,184,166,0.15)'
                                : plan === 'practice'
                                    ? 'rgba(167,139,250,0.15)'
                                    : 'rgba(107,114,128,0.15)',
                            color: plan === 'pro'
                                ? '#14b8a6'
                                : plan === 'practice'
                                    ? '#a78bfa'
                                    : '#6b7280',
                            borderRadius: '20px',
                            fontSize: '0.625rem',
                            fontWeight: 600,
                            letterSpacing: '0.04em',
                            flexShrink: 0,
                        }}>
                            {plan === 'pro' ? 'PRO' : plan === 'practice' ? 'PRACTICE' : 'FREE'}
                        </span>
                    )}
                    {!collapsed && <LogOut size={14} style={{ color: 'var(--text-muted)', cursor: 'pointer', flexShrink: 0 }} />}
                </div>

                {/* Collapse/Expand */}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="btn btn-ghost btn-icon"
                    style={{ width: '100%', marginTop: 'var(--space-2)', justifyContent: 'center' }}
                    aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                </button>
            </div>
        </aside>
    );
}
