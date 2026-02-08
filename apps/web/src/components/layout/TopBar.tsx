'use client';

import React from 'react';
import { Bell, Search } from 'lucide-react';

export default function TopBar() {
    return (
        <header
            style={{
                height: 'var(--header-height)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 var(--space-8)',
                borderBottom: '1px solid var(--border-primary)',
                background: 'rgba(9, 9, 11, 0.8)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                position: 'sticky',
                top: 0,
                zIndex: 40,
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <h6 style={{ margin: 0, fontSize: '0.75rem' }}>
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </h6>
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
