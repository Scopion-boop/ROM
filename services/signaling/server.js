/**
 * WebRTC Signaling Server
 *
 * Lightweight WebSocket server that relays SDP offers/answers and
 * ICE candidates between the desktop browser (host) and the phone
 * browser (remote) for peer-to-peer camera streaming.
 *
 * Protocol:
 *   Connect:  ws://host:4001/ws/signaling?session=<id>&token=<token>&role=host|remote
 *   Messages: { type: 'offer'|'answer'|'ice-candidate', ...payload }
 *
 * Each (session, token) pair forms a room of exactly 2 peers.
 */

import { WebSocketServer } from 'ws';

const PORT = Number(process.env.SIGNAL_PORT ?? 4001);

/** @type {Map<string, Map<string, import('ws').WebSocket>>} room → role → ws */
const rooms = new Map();

function roomKey(session, token) {
    return `${session}:${token}`;
}

const wss = new WebSocketServer({ port: PORT, path: '/ws/signaling' });

wss.on('listening', () => {
    console.log(`[signaling] listening on ws://0.0.0.0:${PORT}/ws/signaling`);
});

wss.on('connection', (ws, req) => {
    const url = new URL(req.url ?? '', `http://localhost:${PORT}`);
    const session = url.searchParams.get('session');
    const token = url.searchParams.get('token');
    const role = url.searchParams.get('role'); // 'host' | 'remote'

    if (!session || !token || !role || !['host', 'remote'].includes(role)) {
        ws.close(4000, 'Missing session, token, or role query param');
        return;
    }

    const key = roomKey(session, token);

    if (!rooms.has(key)) {
        rooms.set(key, new Map());
    }
    const room = rooms.get(key);

    // Prevent duplicate roles
    if (room.has(role)) {
        ws.close(4001, `Role "${role}" already connected in room`);
        return;
    }

    room.set(role, ws);
    console.log(`[signaling] ${role} joined room ${key}`);

    // Notify both peers if room is full
    if (room.size === 2) {
        for (const [r, peer] of room) {
            if (peer.readyState === 1) {
                peer.send(JSON.stringify({ type: 'room-ready', yourRole: r }));
            }
        }
    }

    ws.on('message', (data) => {
        // Relay to the other peer in the room
        const peerRole = role === 'host' ? 'remote' : 'host';
        const peer = room.get(peerRole);
        if (peer && peer.readyState === 1) {
            peer.send(data.toString());
        }
    });

    ws.on('close', () => {
        room.delete(role);
        console.log(`[signaling] ${role} left room ${key}`);

        // Notify remaining peer
        const remaining = room.get(role === 'host' ? 'remote' : 'host');
        if (remaining && remaining.readyState === 1) {
            remaining.send(JSON.stringify({ type: 'peer-disconnected' }));
        }

        // Clean up empty rooms
        if (room.size === 0) {
            rooms.delete(key);
        }
    });

    ws.on('error', (err) => {
        console.error(`[signaling] error from ${role} in room ${key}:`, err.message);
    });
});

// Periodic cleanup of stale rooms (every 5 minutes)
setInterval(() => {
    for (const [key, room] of rooms) {
        let allClosed = true;
        for (const [, peer] of room) {
            if (peer.readyState <= 1) {
                allClosed = false;
                break;
            }
        }
        if (allClosed) {
            rooms.delete(key);
        }
    }
}, 5 * 60 * 1000);
