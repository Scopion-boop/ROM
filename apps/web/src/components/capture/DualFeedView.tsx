/**
 * DualFeedView — Side-by-side or picture-in-picture display of
 * webcam + phone camera feeds with pose overlay.
 */

'use client';

import { useRef, useState } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';

interface DualFeedViewProps {
  /** Primary webcam video element */
  primaryVideo: React.ReactNode;
  /** Overlay component positioned over primary feed */
  overlay?: React.ReactNode;
  /** Secondary feed (from phone camera) — if null, only primary is shown */
  secondaryStream?: MediaStream | null;
  /** Layout mode */
  layout?: 'side-by-side' | 'pip';
  className?: string;
}

export function DualFeedView({
  primaryVideo,
  overlay,
  secondaryStream = null,
  layout = 'pip',
  className = '',
}: DualFeedViewProps) {
  const secondaryRef = useRef<HTMLVideoElement>(null);
  const [currentLayout, setCurrentLayout] = useState(layout);

  // Attach secondary stream to video element
  if (secondaryRef.current && secondaryStream) {
    secondaryRef.current.srcObject = secondaryStream;
  }

  const toggleLayout = () => {
    setCurrentLayout((l) => (l === 'pip' ? 'side-by-side' : 'pip'));
  };

  const hasSecondary = !!secondaryStream;

  if (!hasSecondary) {
    return (
      <div className={`relative overflow-hidden rounded-xl ${className}`}>
        {primaryVideo}
        {overlay}
      </div>
    );
  }

  if (currentLayout === 'side-by-side') {
    return (
      <div className={`flex gap-2 ${className}`}>
        <div className="relative flex-1 overflow-hidden rounded-xl">
          {primaryVideo}
          {overlay}
          <span className="absolute left-2 top-2 rounded bg-gray-900/70 px-2 py-0.5 text-xs text-white">
            Webcam
          </span>
        </div>
        <div className="relative flex-1 overflow-hidden rounded-xl bg-gray-900">
          <video
            ref={secondaryRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-cover"
          />
          <span className="absolute left-2 top-2 rounded bg-gray-900/70 px-2 py-0.5 text-xs text-white">
            Phone
          </span>
        </div>
        <button
          onClick={toggleLayout}
          className="absolute right-2 top-2 rounded-lg bg-gray-800/80 p-1.5 text-white hover:bg-gray-700"
          title="Switch to picture-in-picture"
        >
          <Minimize2 className="h-4 w-4" />
        </button>
      </div>
    );
  }

  // PiP layout — secondary as small overlay in corner
  return (
    <div className={`relative overflow-hidden rounded-xl ${className}`}>
      {primaryVideo}
      {overlay}

      {/* PiP secondary */}
      <div className="absolute bottom-4 right-4 w-1/4 overflow-hidden rounded-lg border-2 border-gray-600 shadow-xl">
        <video
          ref={secondaryRef}
          autoPlay
          playsInline
          muted
          className="h-full w-full object-cover"
        />
        <span className="absolute left-1 top-1 rounded bg-gray-900/70 px-1.5 py-0.5 text-[10px] text-white">
          Phone
        </span>
      </div>

      {/* Layout toggle */}
      <button
        onClick={toggleLayout}
        className="absolute right-2 top-2 rounded-lg bg-gray-800/80 p-1.5 text-white hover:bg-gray-700"
        title="Switch to side-by-side"
      >
        <Maximize2 className="h-4 w-4" />
      </button>
    </div>
  );
}
