export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)',
        padding: '24px 16px',
      }}
    >
      <div style={{ marginBottom: 32, textAlign: 'center' }}>
        <span
          style={{
            fontSize: 24,
            fontWeight: 800,
            color: 'var(--accent)',
            letterSpacing: '-0.04em',
          }}
        >
          PhysioLens
        </span>
      </div>
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-primary)',
          borderRadius: 16,
          padding: 32,
        }}
      >
        {children}
      </div>
    </div>
  );
}
