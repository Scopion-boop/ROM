/**
 * PhoneCameraLink — Generate a QR code for pairing a phone camera via WebRTC.
 *
 * The phone opens the QR URL, accesses its rear camera, and streams
 * video back to the browser over a peer-to-peer WebRTC connection.
 * This provides a secondary camera angle for 3D triangulation or
 * a more ergonomic capture position.
 */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Smartphone, Wifi, CheckCircle, XCircle } from 'lucide-react';

export type PairingStatus = 'idle' | 'waiting' | 'connecting' | 'connected' | 'error';

interface PhoneCameraLinkProps {
    /** WebSocket signaling URL (e.g. ws://localhost:4000/ws/signaling) */
    signalingUrl: string;
    /** Session ID for pairing */
    sessionId: string;
    /** Callback with remote MediaStream when connected */
    onRemoteStream?: (stream: MediaStream) => void;
    /** Callback when connection drops */
    onDisconnect?: () => void;
    className?: string;
}

export function PhoneCameraLink({
    signalingUrl,
    sessionId,
    onRemoteStream,
    onDisconnect,
    className = '',
}: PhoneCameraLinkProps) {
    const [status, setStatus] = useState<PairingStatus>('idle');
    const [pairingToken, setPairingToken] = useState<string>('');
    const pcRef = useRef<RTCPeerConnection | null>(null);
    const wsRef = useRef<WebSocket | null>(null);

    // Generate a short random pairing token
    useEffect(() => {
        const token = Array.from(crypto.getRandomValues(new Uint8Array(6)))
            .map((b) => b.toString(36))
            .join('')
            .slice(0, 8);
        setPairingToken(token);
    }, []);

    // URL the phone will open
    const phoneUrl =
        typeof window !== 'undefined'
            ? `${window.location.origin}/camera/remote?session=${sessionId}&token=${pairingToken}`
            : '';

    // Start signaling connection
    const startPairing = useCallback(() => {
        setStatus('waiting');

        const ws = new WebSocket(`${signalingUrl}?session=${sessionId}&token=${pairingToken}&role=host`);
        wsRef.current = ws;

        const pc = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
        });
        pcRef.current = pc;

        // Handle remote stream
        pc.ontrack = (e) => {
            if (e.streams[0]) {
                setStatus('connected');
                onRemoteStream?.(e.streams[0]);
            }
        };

        // Send ICE candidates to remote
        pc.onicecandidate = (e) => {
            if (e.candidate && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'ice-candidate', candidate: e.candidate }));
            }
        };

        pc.onconnectionstatechange = () => {
            if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
                setStatus('error');
                onDisconnect?.();
            }
        };

        ws.onmessage = async (event) => {
            const msg = JSON.parse(event.data);

            if (msg.type === 'offer') {
                setStatus('connecting');
                await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                ws.send(JSON.stringify({ type: 'answer', sdp: answer }));
            }

            if (msg.type === 'ice-candidate' && msg.candidate) {
                await pc.addIceCandidate(new RTCIceCandidate(msg.candidate));
            }
        };

        ws.onerror = () => setStatus('error');
        ws.onclose = () => {
            if (status !== 'connected') setStatus('idle');
        };
    }, [signalingUrl, sessionId, pairingToken, onRemoteStream, onDisconnect, status]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            pcRef.current?.close();
            wsRef.current?.close();
        };
    }, []);

    const statusConfig = {
        idle: { icon: Smartphone, color: 'text-gray-400', label: 'Ready to pair' },
        waiting: { icon: Wifi, color: 'text-yellow-400', label: 'Waiting for phone…' },
        connecting: { icon: Wifi, color: 'text-blue-400', label: 'Connecting…' },
        connected: { icon: CheckCircle, color: 'text-green-400', label: 'Phone connected' },
        error: { icon: XCircle, color: 'text-red-400', label: 'Connection failed' },
    };

    const { icon: StatusIcon, color, label } = statusConfig[status];

    return (
        <div className={`flex flex-col items-center gap-4 rounded-xl bg-gray-800 p-6 ${className}`}>
            <h3 className="text-sm font-semibold text-gray-300">
                Pair Phone Camera (Optional)
            </h3>

            {/* QR Code placeholder — rendered via qrcode.react at integration time */}
            <div className="flex h-48 w-48 items-center justify-center rounded-lg bg-white p-3">
                {phoneUrl ? (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-2">
                        {/* Will be replaced with <QRCodeSVG> */}
                        <div className="grid h-32 w-32 place-items-center rounded bg-gray-100 text-xs text-gray-500">
                            QR: {pairingToken}
                        </div>
                        <p className="text-[10px] text-gray-600 break-all text-center leading-tight">
                            {phoneUrl}
                        </p>
                    </div>
                ) : (
                    <p className="text-xs text-gray-400">Generating…</p>
                )}
            </div>

            {/* Status indicator */}
            <div className={`flex items-center gap-2 ${color}`}>
                <StatusIcon className="h-4 w-4" />
                <span className="text-sm">{label}</span>
            </div>

            {/* Action buttons */}
            {status === 'idle' && (
                <button
                    onClick={startPairing}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 transition-colors"
                >
                    Start Pairing
                </button>
            )}
            {status === 'error' && (
                <button
                    onClick={startPairing}
                    className="rounded-lg bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-500 transition-colors"
                >
                    Retry
                </button>
            )}

            <p className="text-xs text-gray-500 text-center max-w-[220px]">
                Scan the QR code with your phone to use its camera as a secondary view.
                The phone camera provides a different angle for more accurate 3D measurements.
            </p>
        </div>
    );
}
