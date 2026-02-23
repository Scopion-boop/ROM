/**
 * /camera/remote - Phone camera page for WebRTC streaming.
 *
 * Accessed by scanning the QR code from PhoneCameraLink.
 * Opens the rear camera and streams video back to the host browser.
 */

'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Camera, CheckCircle, Wifi, XCircle } from 'lucide-react';

type ConnectionStatus = 'initializing' | 'camera_ready' | 'connecting' | 'streaming' | 'error';

function RemoteCameraContent() {
    const searchParams = useSearchParams();
    const sessionId = searchParams.get('session');
    const token = searchParams.get('token');

    const videoRef = useRef<HTMLVideoElement>(null);
    const pcRef = useRef<RTCPeerConnection | null>(null);
    const wsRef = useRef<WebSocket | null>(null);

    const [status, setStatus] = useState<ConnectionStatus>('initializing');
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        if (!sessionId || !token) {
            setStatus('error');
            setErrorMsg('Missing session or token in URL.');
            return;
        }

        let stream: MediaStream | null = null;

        const init = async () => {
            // 1. Access rear camera
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: { ideal: 'environment' },
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                    },
                    audio: false,
                });

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
                setStatus('camera_ready');
            } catch {
                setStatus('error');
                setErrorMsg('Could not access camera. Please allow camera access.');
                return;
            }

            // 2. Connect to signaling server
            const baseSignalUrl = process.env.NEXT_PUBLIC_SIGNAL_URL
                ?? `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}/ws/signaling`;
            const wsUrl = `${baseSignalUrl}?session=${sessionId}&token=${token}&role=remote`;

            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;

            const pc = new RTCPeerConnection({
                iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
            });
            pcRef.current = pc;

            // Add camera tracks to peer connection
            if (stream) {
                for (const track of stream.getTracks()) {
                    pc.addTrack(track, stream);
                }
            }

            pc.onicecandidate = (e) => {
                if (e.candidate && ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ type: 'ice-candidate', candidate: e.candidate }));
                }
            };

            pc.onconnectionstatechange = () => {
                if (pc.connectionState === 'connected') {
                    setStatus('streaming');
                }
                if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
                    setStatus('error');
                    setErrorMsg('Connection lost.');
                }
            };

            ws.onopen = async () => {
                setStatus('connecting');
                // Create and send offer
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                ws.send(JSON.stringify({ type: 'offer', sdp: offer }));
            };

            ws.onmessage = async (event) => {
                const msg = JSON.parse(event.data);

                if (msg.type === 'answer') {
                    await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
                }
                if (msg.type === 'ice-candidate' && msg.candidate) {
                    await pc.addIceCandidate(new RTCIceCandidate(msg.candidate));
                }
            };

            ws.onerror = () => {
                setStatus('error');
                setErrorMsg('Signaling connection failed.');
            };
        };

        init();

        return () => {
            stream?.getTracks().forEach((t) => t.stop());
            pcRef.current?.close();
            wsRef.current?.close();
        };
    }, [sessionId, token]);

    const statusConfig: Record<
        ConnectionStatus,
        { icon: typeof Camera; text: string; color: string }
    > = {
        initializing: { icon: Camera, text: 'Initializing...', color: 'var(--text-secondary)' },
        camera_ready: { icon: Camera, text: 'Camera ready', color: 'var(--warning)' },
        connecting: { icon: Wifi, text: 'Connecting to host...', color: 'var(--accent)' },
        streaming: { icon: CheckCircle, text: 'Streaming to host', color: 'var(--success)' },
        error: { icon: XCircle, text: errorMsg || 'Error', color: 'var(--error)' },
    };

    const { icon: StatusIcon, text, color } = statusConfig[status];

    return (
        <div
            style={{
                display: 'flex',
                minHeight: '100vh',
                flexDirection: 'column',
                background: 'var(--bg-primary)',
            }}
        >
            {/* Camera preview */}
            <div style={{ position: 'relative', flex: 1 }}>
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{
                        height: '100%',
                        width: '100%',
                        objectFit: 'cover',
                    }}
                />

                {/* Status overlay */}
                <div
                    style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        background: 'linear-gradient(to top, rgba(9,9,11,0.9), transparent)',
                        padding: '1.5rem',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            color: color,
                        }}
                    >
                        <StatusIcon style={{ height: 20, width: 20 }} />
                        <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{text}</span>
                    </div>
                    {status === 'streaming' && (
                        <p
                            style={{
                                marginTop: '0.25rem',
                                fontSize: '0.75rem',
                                color: 'var(--text-muted)',
                            }}
                        >
                            Keep this screen open. Your camera feed is being used for ROM measurement.
                        </p>
                    )}
                </div>

                {/* Recording indicator */}
                {status === 'streaming' && (
                    <div
                        style={{
                            position: 'absolute',
                            right: '1rem',
                            top: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.375rem',
                        }}
                    >
                        <span
                            style={{
                                height: 12,
                                width: 12,
                                borderRadius: '50%',
                                background: 'var(--error)',
                                animation: 'pulse 2s ease-in-out infinite',
                            }}
                        />
                        <span
                            style={{
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                color: 'var(--text-primary)',
                            }}
                        >
                            LIVE
                        </span>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
            `}</style>
        </div>
    );
}

export default function RemoteCameraPage() {
    return (
        <Suspense
            fallback={
                <div
                    style={{
                        display: 'flex',
                        minHeight: '100vh',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'var(--bg-primary)',
                        color: 'var(--text-secondary)',
                    }}
                >
                    Loading...
                </div>
            }
        >
            <RemoteCameraContent />
        </Suspense>
    );
}
