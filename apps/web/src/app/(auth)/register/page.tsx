'use client';
import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { Loader2 } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

const ROLES = [
    { value: 'clinician', label: 'Clinician' },
    { value: 'clinic_admin', label: 'Clinic Administrator' },
];

export default function RegisterPage() {
    return (
        <Suspense fallback={null}>
            <RegisterForm />
        </Suspense>
    );
}

function RegisterForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const inviteToken = searchParams.get('invite');

    const [displayName, setDisplayName] = useState('');
    const [clinicName, setClinicName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [role, setRole] = useState('clinician');
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
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }
        try {
            const body: Record<string, string> = { email, password, displayName, role };
            if (inviteToken) {
                body.inviteToken = inviteToken;
            } else {
                body.clinicName = clinicName;
            }
            const res = await fetch(`${API_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
                credentials: 'include',
            });
            if (!res.ok) {
                const data = await res.json();
                setError(data.error ?? 'Registration failed');
                return;
            }
            const { token } = await res.json();
            authClient.login(token);
            router.push('/onboarding');
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6, letterSpacing: '-0.03em' }}>
                Create your account
            </h1>
            <p style={{ fontSize: 14, color: 'var(--text-tertiary)', marginBottom: 24 }}>
                Free plan — no credit card required
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

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                    <label htmlFor="reg-name" style={labelStyle}>Full name</label>
                    <input
                        id="reg-name"
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        style={inputStyle}
                        placeholder="Dr. Jane Smith"
                        required
                    />
                </div>

                {!inviteToken && (
                    <div>
                        <label htmlFor="reg-clinic" style={labelStyle}>Clinic / Practice name</label>
                        <input
                            id="reg-clinic"
                            type="text"
                            value={clinicName}
                            onChange={(e) => setClinicName(e.target.value)}
                            style={inputStyle}
                            placeholder="Auckland Physio Centre"
                            required
                        />
                    </div>
                )}

                <div>
                    <label htmlFor="reg-role" style={labelStyle}>Role</label>
                    <select
                        id="reg-role"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        style={{ ...inputStyle, cursor: 'pointer' }}
                    >
                        {ROLES.map((r) => (
                            <option key={r.label} value={r.value}>{r.label}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label htmlFor="reg-email" style={labelStyle}>Email</label>
                    <input
                        id="reg-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        style={inputStyle}
                        placeholder="you@clinic.com"
                        required
                    />
                </div>

                <div>
                    <label htmlFor="reg-password" style={labelStyle}>Password</label>
                    <input
                        id="reg-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={inputStyle}
                        placeholder="At least 8 characters"
                        minLength={8}
                        required
                    />
                </div>

                <div>
                    <label htmlFor="reg-confirm-password" style={labelStyle}>Confirm password</label>
                    <input
                        id="reg-confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        style={inputStyle}
                        placeholder="Re-enter your password"
                        minLength={8}
                        required
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary"
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 }}
                >
                    {loading ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Creating account...</> : 'Create free account'}
                </button>
            </form>

            <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', marginTop: 16, lineHeight: 1.5 }}>
                By registering you agree to our Terms of Service and Privacy Policy.
            </p>

            <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-tertiary)', marginTop: 12 }}>
                Already have an account?{' '}
                <Link href="/login" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>
                    Sign in
                </Link>
            </p>
        </>
    );
}
