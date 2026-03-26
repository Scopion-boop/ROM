import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'PhysioLens — AI ROM Measurement for Physiotherapists',
  description:
    'Browser-based computer vision that measures joint Range-of-Motion and auto-generates clinical notes. No wearables, no calibration required.',
  keywords: [
    'physiotherapy software',
    'ROM measurement',
    'clinical documentation',
    'AI notes',
    'range of motion',
    'SOAP notes',
    'physiotherapy AI',
  ],
  openGraph: {
    title: 'PhysioLens — AI ROM Measurement',
    description: 'Measure ROM in 90 seconds. Document in half the time.',
    type: 'website',
  },
};

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
