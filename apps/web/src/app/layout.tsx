import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const jetbrainsMono = JetBrains_Mono({
    subsets: ['latin'],
    variable: '--font-jetbrains',
});

export const metadata: Metadata = {
    title: 'PhysioLens',
    description: 'AI-powered ROM measurement for physiotherapists',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
            <body style={{ margin: 0, padding: 0, fontFamily: inter.style.fontFamily }}>{children}</body>
        </html>
    );
}
