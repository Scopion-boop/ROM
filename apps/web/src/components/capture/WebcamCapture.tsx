/**
 * WebcamCapture — Live webcam feed with device selection.
 *
 * Renders the camera preview, device dropdown, and start/stop controls.
 * Exposes a `captureFrame()` method via ref for parent components.
 */

'use client';

import { forwardRef, useImperativeHandle } from 'react';
import { Camera, CameraOff, RefreshCw } from 'lucide-react';
import { useCamera, type UseCameraOptions } from '../../hooks/useCamera';

export interface WebcamCaptureHandle {
  captureFrame: () => string | null;
  stop: () => void;
  start: () => Promise<void>;
  isActive: boolean;
  videoRef: React.RefObject<HTMLVideoElement | null>;
}

interface WebcamCaptureProps extends UseCameraOptions {
  /** Callback when the stream becomes active */
  onStreamReady?: () => void;
  /** CSS class for the outer wrapper */
  className?: string;
  /** Show device switcher (default true) */
  showDeviceSwitcher?: boolean;
}

export const WebcamCapture = forwardRef<WebcamCaptureHandle, WebcamCaptureProps>(
  function WebcamCapture(
    { onStreamReady, className = '', showDeviceSwitcher = true, ...opts },
    ref,
  ) {
    const {
      videoRef,
      isActive,
      isLoading,
      error,
      devices,
      start,
      stop,
      switchDevice,
      captureFrame,
    } = useCamera({
      ...opts,
      autoStart: opts.autoStart ?? true,
    });

    useImperativeHandle(
      ref,
      () => ({
        captureFrame,
        stop,
        start,
        isActive,
        videoRef,
      }),
      [captureFrame, stop, start, isActive, videoRef],
    );

    // Notify parent when stream becomes active
    if (isActive && onStreamReady) {
      onStreamReady();
    }

    return (
      <div className={`relative overflow-hidden rounded-xl bg-gray-900 ${className}`}>
        {/* Video element */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="h-full w-full object-cover"
          style={{ transform: 'scaleX(-1)' }}
        />

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80">
            <div className="flex flex-col items-center gap-3">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-400" />
              <p className="text-sm text-gray-300">Starting camera…</p>
            </div>
          </div>
        )}

        {/* Error overlay */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/90 p-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <CameraOff className="h-12 w-12 text-red-400" />
              <p className="text-sm text-red-300">{error}</p>
              <button
                onClick={() => start()}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Inactive state */}
        {!isActive && !isLoading && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <button
              onClick={() => start()}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-500"
            >
              <Camera className="h-5 w-5" />
              Start Camera
            </button>
          </div>
        )}

        {/* Device selector */}
        {showDeviceSwitcher && isActive && devices.length > 1 && (
          <div className="absolute bottom-3 left-3">
            <select
              onChange={(e) => switchDevice(e.target.value)}
              className="rounded-md bg-gray-800/80 px-2 py-1 text-xs text-gray-200 backdrop-blur-sm"
            >
              {devices.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Active indicator */}
        {isActive && (
          <div className="absolute right-3 top-3 flex items-center gap-1.5">
            <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
            <span className="text-xs font-medium text-white/80">LIVE</span>
          </div>
        )}
      </div>
    );
  },
);
