'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { Loader2 } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const inputStyle: React.CSSProperties = {
        width: '100%',
        padding: '10px 14px',
        background: 'var(--bg-tertiary)',
        border: '1px solid var(--border-primary)',
        borderRadius: 8,
        color: 'var(--text-primary)',
        fontSize: 14,
        outline: 'none',
        boxSizing: 'border-box',
    };

    const labelStyle: React.CSSProperties = {
        display: 'block',
        fontSize: 13,
        fontWeight: 500,
        color: 'var(--text-secondary)',
        marginBottom: 6,
    };

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
                credentials: 'include',
            });
            if (!res.ok) {
                const data = await res.json();
                setError(data.error ?? 'Login failed');
                return;
            }
            const { token } = await res.json();
            authClient.login(token);
            // Check onboarding status
            const meRes = await fetch(`${API_URL}/api/auth/me`, {
                headers: authClient.getAuthHeaders(),
            });
            if (meRes.ok) {
                const me = await meRes.json();
                if (!me.onboardingCompleted) {
                    router.push('/onboarding');
                    return;
                }
            }
            const params = new URLSearchParams(window.location.search);
            router.push(params.get('next') ?? '/dashboard');
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6, letterSpacing: '-0.03em' }}>
                Sign in to PhysioLens
            </h1>
            <p style={{ fontSize: 14, color: 'var(--text-tertiary)', marginBottom: 24 }}>
                AI-powered ROM measurement for clinicians
            </p>

            {error && (
                <div
                    style={{
                        padding: '10px 14px',
                        borderRadius: 8,
                        background: 'rgba(239,68,68,0.1)',
                        border: '1px solid rgba(239,68,68,0.3)',
                        color: 'var(--error)',
                        fontSize: 13,
                        marginBottom: 16,
                    }}
                >
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                    <label htmlFor="login-email" style={labelStyle}>Email</label>
                    <input
                        id="login-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        style={inputStyle}
                        placeholder="you@clinic.com"
                        required
                        autoFocus
                    />
                </div>
                <div>
                    <label htmlFor="login-password" style={labelStyle}>Password</label>
                    <input
                        id="login-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={inputStyle}
                        placeholder="********"
                        required
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary"
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                    {loading ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Signing in...</> : 'Sign in'}
                </button>
            </form>

            <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-tertiary)', marginTop: 12 }}>
                <button
                    type="button"
                    onClick={() => {
                        const resetEmail = window.prompt('Enter your email to receive a password reset link:');
                        if (resetEmail) {
                            alert('If an account exists for ' + resetEmail + ', you will receive a reset link shortly.');
                        }
                    }}
                    style={{
                        background: 'none', border: 'none', color: 'var(--accent)',
                        cursor: 'pointer', fontSize: 13, fontWeight: 500, padding: 0,
                    }}
                >
                    Forgot your password?
                </button>
            </p>

            <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-tertiary)', marginTop: 20 }}>
                Don&apos;t have an account?{' '}
                <Link href="/register" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>
                    Start free
                </Link>
            </p>
        </>
    );
}
