'use client';
import { useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import { PlanProvider } from '@/lib/plan-context';
import { UserProvider } from '@/lib/user-context';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <UserProvider>
      <PlanProvider>
        <Sidebar mobileOpen={mobileMenuOpen} onMobileClose={() => setMobileMenuOpen(false)} />
        <div
          className="main-content"
          style={{
            marginLeft: 'var(--sidebar-width)',
            minHeight: '100vh',
            transition: 'margin-left var(--duration-normal) var(--ease-out)',
          }}
        >
          <TopBar onMenuOpen={() => setMobileMenuOpen(true)} />
          <div style={{ padding: 'var(--space-8)' }}>{children}</div>
        </div>
      </PlanProvider>
    </UserProvider>
  );
}
