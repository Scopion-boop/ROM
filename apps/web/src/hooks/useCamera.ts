/**
 * useCamera — React hook wrapping getUserMedia for webcam access.
 *
 * Handles device enumeration, stream lifecycle, and resolution negotiation.
 * Returns a ref to attach to a <video> element plus stream metadata.
 */

'use client';

import {
    useCallback,
    useEffect,
    useRef,
    useState,
    type RefObject,
} from 'react';

export interface CameraDevice {
    deviceId: string;
    label: string;
}

export interface UseCameraOptions {
    /** Preferred resolution width (default 1280) */
    width?: number;
    /** Preferred resolution height (default 720) */
    height?: number;
    /** Preferred facing mode for mobile (default 'user') */
    facingMode?: 'user' | 'environment';
    /** Specific device ID to use */
    deviceId?: string;
    /** Start camera automatically (default true) */
    autoStart?: boolean;
}

export interface UseCameraReturn {
    videoRef: RefObject<HTMLVideoElement | null>;
    stream: MediaStream | null;
    isActive: boolean;
    isLoading: boolean;
    error: string | null;
    devices: CameraDevice[];
    start: () => Promise<void>;
    stop: () => void;
    switchDevice: (deviceId: string) => Promise<void>;
    captureFrame: () => string | null;
}

export function useCamera(options: UseCameraOptions = {}): UseCameraReturn {
    const {
        width = 1280,
        height = 720,
        facingMode = 'user',
        deviceId,
        autoStart = true,
    } = options;

    const videoRef = useRef<HTMLVideoElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [isActive, setIsActive] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [devices, setDevices] = useState<CameraDevice[]>([]);

    // Enumerate video devices
    const enumerateDevices = useCallback(async () => {
        try {
            const allDevices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = allDevices
                .filter((d) => d.kind === 'videoinput')
                .map((d) => ({
                    deviceId: d.deviceId,
                    label: d.label || `Camera ${d.deviceId.slice(0, 6)}`,
                }));
            setDevices(videoDevices);
        } catch {
            // Silently fail — devices will be populated after permission grant
        }
    }, []);

    // Start the camera stream
    const start = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const constraints: MediaStreamConstraints = {
                video: {
                    width: { ideal: width },
                    height: { ideal: height },
                    ...(deviceId
                        ? { deviceId: { exact: deviceId } }
                        : { facingMode }),
                },
                audio: false,
            };

            const stream =
                await navigator.mediaDevices.getUserMedia(constraints);

            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
            }

            setIsActive(true);

            // Re-enumerate now that we have permission (labels populated)
            await enumerateDevices();
        } catch (err) {
            const msg =
                err instanceof DOMException
                    ? err.name === 'NotAllowedError'
                        ? 'Camera access denied. Please allow camera access in your browser settings.'
                        : err.name === 'NotFoundError'
                            ? 'No camera found on this device.'
                            : `Camera error: ${err.message}`
                    : 'Failed to access camera.';
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    }, [width, height, facingMode, deviceId, enumerateDevices]);

    // Stop the camera stream
    const stop = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setIsActive(false);
    }, []);

    // Switch to a different device
    const switchDevice = useCallback(
        async (newDeviceId: string) => {
            stop();
            const constraints: MediaStreamConstraints = {
                video: {
                    deviceId: { exact: newDeviceId },
                    width: { ideal: width },
                    height: { ideal: height },
                },
                audio: false,
            };

            try {
                const stream =
                    await navigator.mediaDevices.getUserMedia(constraints);
                streamRef.current = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    await videoRef.current.play();
                }
                setIsActive(true);
            } catch {
                setError('Failed to switch camera.');
            }
        },
        [stop, width, height],
    );

    // Capture a single frame as base64 JPEG
    const captureFrame = useCallback((): string | null => {
        const video = videoRef.current;
        if (!video || !isActive) return null;

        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        ctx.drawImage(video, 0, 0);
        // Return base64 without the data:image/jpeg;base64, prefix
        return canvas.toDataURL('image/jpeg', 0.85).split(',')[1] ?? null;
    }, [isActive]);

    // Auto-start
    useEffect(() => {
        if (autoStart) {
            start();
        }
        return () => {
            stop();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return {
        videoRef,
        stream: streamRef.current,
        isActive,
        isLoading,
        error,
        devices,
        start,
        stop,
        switchDevice,
        captureFrame,
    };
}
