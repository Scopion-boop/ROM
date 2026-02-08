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
    HeartPulse,
} from 'lucide-react';

const NAV_ITEMS = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/sessions/new', label: 'New Session', icon: Plus },
    { href: '#', label: 'Sessions', icon: FolderOpen },
    { href: '#', label: 'Measurements', icon: Activity },
    { href: '#', label: 'Reports', icon: FileText },
];

const BOTTOM_NAV = [
    { href: '#', label: 'Compliance', icon: Shield },
    { href: '#', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);

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
                        background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                    }}
                >
                    <HeartPulse size={20} color="#000" strokeWidth={2.5} />
                </div>
                {!collapsed && (
                    <div style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: '1rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
                            ROM
                        </span>
                        <span style={{ fontSize: '0.625rem', display: 'block', color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                            Clinical Platform
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
