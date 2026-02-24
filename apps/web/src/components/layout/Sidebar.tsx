'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    FolderOpen,
    ChevronLeft,
    ChevronRight,
    Plus,
    LogOut,
    CreditCard,
    Building2,
} from 'lucide-react';
import { usePlan } from '@/lib/plan-context';
import { useUser } from '@/lib/user-context';
import { authClient } from '@/lib/auth-client';

const NAV_ITEMS = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/sessions/new', label: 'New Session', icon: Plus },
    { href: '/sessions', label: 'Sessions', icon: FolderOpen },
    { href: '/dashboard/billing', label: 'Billing & Plan', icon: CreditCard },
];

function getInitials(name: string | null): string {
    if (!name) return '?';
    return name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
}

interface SidebarProps {
    mobileOpen?: boolean;
    onMobileClose?: () => void;
}

export default function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);
    const { plan } = usePlan();
    const { displayName, role, specialty } = useUser();

    const isMobileOverlay = !!mobileOpen;
    const showExpanded = isMobileOverlay || !collapsed;

    const navItems = plan === 'pro'
        ? [...NAV_ITEMS.slice(0, 3), { href: '/dashboard/clinic', label: 'Clinic', icon: Building2 }, NAV_ITEMS[3]!]
        : NAV_ITEMS;

    const sidebar = (
        <aside
            style={{
                width: showExpanded ? 'var(--sidebar-width)' : 'var(--sidebar-collapsed)',
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
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 20 L20 20" stroke="var(--text-tertiary)" strokeWidth="1.5" strokeLinecap="round" />
                        <path d="M4 20 L16 6" stroke="var(--text-tertiary)" strokeWidth="1.5" strokeLinecap="round" />
                        <path d="M10 20 A6 6 0 0 1 12.4 14.4" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" fill="none" />
                        <circle cx="11.6" cy="16.2" r="1" fill="var(--accent)" />
                    </svg>
                </div>
                {showExpanded && (
                    <div style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: '1rem', fontWeight: 600, letterSpacing: '-0.02em' }}>
                            Physio<span style={{ fontWeight: 400, color: 'var(--text-secondary)' }}>Lens</span>
                        </span>
                    </div>
                )}
            </div>

            {/* Main Nav */}
            <nav style={{ flex: 1, padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: '2px', overflowY: 'auto' }}>
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', padding: collapsed ? '0' : 'var(--space-2) var(--space-3)', marginBottom: 'var(--space-1)' }}>
                    {showExpanded && 'Platform'}
                </div>
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href + item.label}
                            href={item.href}
                            onClick={onMobileClose}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--space-3)',
                                padding: showExpanded ? 'var(--space-2) var(--space-3)' : 'var(--space-3)',
                                borderRadius: 'var(--radius-md)',
                                color: isActive ? 'var(--text-primary)' : 'var(--text-tertiary)',
                                background: isActive ? 'var(--bg-card-hover)' : 'transparent',
                                fontSize: '0.875rem',
                                fontWeight: isActive ? 500 : 400,
                                textDecoration: 'none',
                                transition: 'all var(--duration-fast) var(--ease-out)',
                                justifyContent: showExpanded ? 'flex-start' : 'center',
                                position: 'relative',
                            }}
                            title={!showExpanded ? item.label : undefined}
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
                            {showExpanded && <span>{item.label}</span>}
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom section */}
            <div style={{ padding: 'var(--space-4)', borderTop: '1px solid var(--border-primary)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {/* User */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-3)',
                        padding: 'var(--space-3)',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--bg-tertiary)',
                        justifyContent: showExpanded ? 'flex-start' : 'center',
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
                        {getInitials(displayName)}
                    </div>
                    {showExpanded && (
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                            <div style={{ fontSize: '0.8125rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {displayName || 'User'}
                            </div>
                            <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                                {specialty || role || 'Clinician'}
                            </div>
                        </div>
                    )}
                    {showExpanded && (
                        <span style={{
                            padding: '2px 6px',
                            background: plan === 'pro' ? 'rgba(14,205,186,0.15)' : 'rgba(107,114,128,0.15)',
                            color: plan === 'pro' ? 'var(--accent)' : '#6b7280',
                            borderRadius: '20px',
                            fontSize: '0.625rem',
                            fontWeight: 600,
                            letterSpacing: '0.04em',
                            flexShrink: 0,
                        }}>
                            {plan === 'pro' ? 'PRO' : 'FREE'}
                        </span>
                    )}
                    {showExpanded && (
                        <button
                            onClick={() => authClient.logout()}
                            aria-label="Log out"
                            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', flexShrink: 0, display: 'flex' }}
                        >
                            <LogOut size={14} style={{ color: 'var(--text-muted)' }} />
                        </button>
                    )}
                </div>

                {/* Collapse/Expand — desktop only */}
                {!isMobileOverlay && (
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="btn btn-ghost btn-icon"
                        style={{ width: '100%', marginTop: 'var(--space-2)', justifyContent: 'center' }}
                        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    >
                        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                    </button>
                )}
            </div>
        </aside>
    );

    if (isMobileOverlay) {
        return (
            <>
                <div
                    className="sidebar-mobile-backdrop"
                    onClick={onMobileClose}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0, 0, 0, 0.6)',
                        zIndex: 49,
                    }}
                />
                {sidebar}
            </>
        );
    }

    return <div className="sidebar-desktop">{sidebar}</div>;
}
