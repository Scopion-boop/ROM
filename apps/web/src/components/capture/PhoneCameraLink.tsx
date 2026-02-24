/**
 * PhoneCameraLink — Generate a QR code for pairing a phone camera via WebRTC.
 *
 * The phone opens the QR URL, accesses its rear camera, and streams
 * video back to the browser over a peer-to-peer WebRTC connection.
 * This provides a secondary camera angle for 3D triangulation or
 * a more ergonomic capture position.
 *
 * Connection protocol:
 *   1. Host (desktop) connects to signaling server immediately on mount
 *   2. Phone scans QR → connects as remote → both get "room-ready"
 *   3. Host sends "ready-for-offer" → phone creates & sends WebRTC offer
 *   4. Host receives offer, creates answer, exchange ICE → connected
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { Smartphone, Wifi, CheckCircle, XCircle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export type PairingStatus = 'idle' | 'waiting' | 'connecting' | 'connected' | 'error';

interface PhoneCameraLinkProps {
    /** WebSocket signaling URL (e.g. ws://localhost:4001/ws/signaling) */
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
    const statusRef = useRef<PairingStatus>('idle');
    const onRemoteStreamRef = useRef(onRemoteStream);
    const onDisconnectRef = useRef(onDisconnect);

    // Keep callback refs current without triggering reconnect
    useEffect(() => { onRemoteStreamRef.current = onRemoteStream; }, [onRemoteStream]);
    useEffect(() => { onDisconnectRef.current = onDisconnect; }, [onDisconnect]);

    // Generate a short random pairing token once on mount
    useEffect(() => {
        const token = Array.from(crypto.getRandomValues(new Uint8Array(6)))
            .map((b) => b.toString(36))
            .join('')
            .slice(0, 8);
        setPairingToken(token);
    }, []);

    // URL the phone will open
    const phoneUrl =
        typeof window !== 'undefined' && pairingToken
            ? `${window.location.origin}/camera/remote?session=${sessionId}&token=${pairingToken}`
            : '';

    /** Connect to signaling server and set up WebRTC */
    useEffect(() => {
        if (!pairingToken || !signalingUrl || !sessionId) return;

        // Auto-start: connect to signaling immediately so host is ready
        // before phone scans QR
        const updateStatus = (s: PairingStatus) => {
            statusRef.current = s;
            setStatus(s);
        };

        updateStatus('waiting');

        const ws = new WebSocket(
            `${signalingUrl}?session=${sessionId}&token=${pairingToken}&role=host`,
        );
        wsRef.current = ws;

        const pc = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
        });
        pcRef.current = pc;

        // Handle remote stream arriving over WebRTC
        pc.ontrack = (e) => {
            if (e.streams[0]) {
                updateStatus('connected');
                onRemoteStreamRef.current?.(e.streams[0]);
            }
        };

        // Send ICE candidates to remote via signaling
        pc.onicecandidate = (e) => {
            if (e.candidate && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'ice-candidate', candidate: e.candidate }));
            }
        };

        pc.onconnectionstatechange = () => {
            if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
                updateStatus('error');
                onDisconnectRef.current?.();
            }
        };

        ws.onmessage = async (event) => {
            const msg = JSON.parse(event.data as string);

            if (msg.type === 'room-ready') {
                // Both peers connected — tell phone we're ready
                ws.send(JSON.stringify({ type: 'ready-for-offer' }));
            }

            if (msg.type === 'offer') {
                updateStatus('connecting');
                await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                ws.send(JSON.stringify({ type: 'answer', sdp: answer }));
            }

            if (msg.type === 'ice-candidate' && msg.candidate) {
                await pc.addIceCandidate(new RTCIceCandidate(msg.candidate));
            }
        };

        ws.onerror = () => updateStatus('error');
        ws.onclose = () => {
            // Use ref to avoid stale closure
            if (statusRef.current !== 'connected') {
                updateStatus('error');
            }
        };

        return () => {
            pc.close();
            ws.close();
        };
    }, [signalingUrl, sessionId, pairingToken]);

    /** Retry by generating a fresh pairing token (triggers reconnect) */
    const handleRetry = () => {
        pcRef.current?.close();
        wsRef.current?.close();
        const token = Array.from(crypto.getRandomValues(new Uint8Array(6)))
            .map((b) => b.toString(36))
            .join('')
            .slice(0, 8);
        setPairingToken(token);
    };

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

            {/* QR Code */}
            <div className="flex h-48 w-48 items-center justify-center rounded-lg bg-white p-3">
                {phoneUrl ? (
                    <QRCodeSVG value={phoneUrl} size={168} level="M" role="img" aria-label="QR code to pair phone camera" />
                ) : (
                    <p className="text-xs text-gray-400">Generating…</p>
                )}
            </div>

            {/* Status indicator */}
            <div className={`flex items-center gap-2 ${color}`}>
                <StatusIcon className="h-4 w-4" />
                <span className="text-sm">{label}</span>
            </div>

            {/* Retry on error */}
            {status === 'error' && (
                <button
                    onClick={handleRetry}
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
