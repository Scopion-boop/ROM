'use client';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import { PlanProvider } from '@/lib/plan-context';

export default function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <PlanProvider>
            <Sidebar />
            <div
                style={{
                    marginLeft: 'var(--sidebar-width)',
                    minHeight: '100vh',
                    transition: 'margin-left var(--duration-normal) var(--ease-out)',
                }}
            >
                <TopBar />
                <div style={{ padding: 'var(--space-8)' }}>{children}</div>
            </div>
        </PlanProvider>
    );
}
