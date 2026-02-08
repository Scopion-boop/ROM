/**
 * /camera/remote — Phone camera page for WebRTC streaming.
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
            const wsProtocol = globalThis.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${wsProtocol}//${globalThis.location.host}/ws/signaling?session=${sessionId}&token=${token}&role=remote`;

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

    const statusDisplay = {
        initializing: { icon: Camera, text: 'Initializing…', color: 'text-gray-400' },
        camera_ready: { icon: Camera, text: 'Camera ready', color: 'text-yellow-400' },
        connecting: { icon: Wifi, text: 'Connecting to host…', color: 'text-blue-400' },
        streaming: { icon: CheckCircle, text: 'Streaming to host', color: 'text-green-400' },
        error: { icon: XCircle, text: errorMsg || 'Error', color: 'text-red-400' },
    };

    const { icon: StatusIcon, text, color } = statusDisplay[status];

    return (
        <div className="flex min-h-screen flex-col bg-gray-950">
            {/* Camera preview */}
            <div className="relative flex-1">
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="h-full w-full object-cover"
                />

                {/* Status overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-950/90 to-transparent p-6">
                    <div className={`flex items-center gap-2 ${color}`}>
                        <StatusIcon className="h-5 w-5" />
                        <span className="text-sm font-medium">{text}</span>
                    </div>
                    {status === 'streaming' && (
                        <p className="mt-1 text-xs text-gray-500">
                            Keep this screen open. Your camera feed is being used for ROM measurement.
                        </p>
                    )}
                </div>

                {/* Recording indicator */}
                {status === 'streaming' && (
                    <div className="absolute right-4 top-4 flex items-center gap-1.5">
                        <span className="h-3 w-3 animate-pulse rounded-full bg-red-500" />
                        <span className="text-xs font-bold text-white">LIVE</span>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function RemoteCameraPage() {
    return (
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-gray-950 text-gray-400">Loading…</div>}>
            <RemoteCameraContent />
        </Suspense>
    );
}
