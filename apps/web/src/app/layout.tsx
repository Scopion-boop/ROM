import './globals.css';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';

export const metadata = {
    title: 'ROM Platform — Clinical Musculoskeletal Measurement',
    description: 'AI-powered range-of-motion measurement assistant for clinicians',
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body>
                <Sidebar />
                <div
                    style={{
                        marginLeft: 'var(--sidebar-width)',
                        minHeight: '100vh',
                        transition: 'margin-left var(--duration-normal) var(--ease-out)',
                    }}
                >
                    <TopBar />
                    <div style={{ padding: 'var(--space-8)' }}>
                        {children}
                    </div>
                </div>
            </body>
        </html>
    );
}
