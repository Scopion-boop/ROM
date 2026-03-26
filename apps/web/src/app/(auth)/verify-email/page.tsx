export default function VerifyEmailPage() {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 40, marginBottom: 16 }}>📬</div>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Check your inbox</h1>
      <p style={{ fontSize: 14, color: 'var(--text-tertiary)', lineHeight: 1.6 }}>
        We sent a verification link to your email address.
        <br />
        Click it to activate your PhysioLens account.
      </p>
    </div>
  );
}
