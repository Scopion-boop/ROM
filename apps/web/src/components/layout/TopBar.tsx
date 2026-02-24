'use client';

import React from 'react';
import { Bell, Menu, Search } from 'lucide-react';

interface TopBarProps {
    onMenuOpen?: () => void;
}

export default function TopBar({ onMenuOpen }: TopBarProps) {
    return (
        <header
            style={{
                height: 'var(--header-height)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 var(--space-8)',
                borderBottom: '1px solid var(--border-primary)',
                background: 'rgba(14, 17, 23, 0.8)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                position: 'sticky',
                top: 0,
                zIndex: 40,
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                {onMenuOpen && (
                    <button
                        className="btn btn-ghost btn-icon mobile-menu-trigger"
                        aria-label="Open menu"
                        onClick={onMenuOpen}
                        style={{ display: 'none' }}
                    >
                        <Menu size={20} />
                    </button>
                )}
                <span style={{
                    margin: 0,
                    fontSize: '0.6875rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: 'var(--text-tertiary)',
                }}>
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <button className="btn btn-ghost btn-icon" aria-label="Search">
                    <Search size={18} />
                </button>
                <div style={{ position: 'relative' }}>
                    <button className="btn btn-ghost btn-icon" aria-label="Notifications">
                        <Bell size={18} />
                    </button>
                    <div
                        style={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            width: 8,
                            height: 8,
                            borderRadius: 'var(--radius-full)',
                            background: 'var(--accent)',
                            border: '2px solid var(--bg-primary)',
                        }}
                    />
                </div>
            </div>
        </header>
    );
}
