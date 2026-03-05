/**
 * Signaling Server Tests
 *
 * The signaling server starts a WebSocket server on import (top-level
 * `new WebSocketServer(...)`) so we cannot import it directly in tests
 * without side effects. These tests validate:
 *   1. Smoke tests (documentable expectations)
 *   2. WebSocket connection/relay behavior via child process spawn
 */

import { describe, it, expect, afterAll } from 'vitest';
import { WebSocket } from 'ws';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SERVER_PATH = path.resolve(__dirname, '..', 'server.js');

// Use a random high port to avoid conflicts
const TEST_PORT = 14000 + Math.floor(Math.random() * 1000);

/** Start the signaling server as a child process on a given port. */
function startServer(port) {
    return new Promise((resolve, reject) => {
        const child = spawn('node', [SERVER_PATH], {
            env: { ...process.env, SIGNAL_PORT: String(port) },
            stdio: ['pipe', 'pipe', 'pipe'],
        });

        const timeout = setTimeout(() => {
            reject(new Error('Server did not start within 5s'));
        }, 5000);

        child.stdout.on('data', (data) => {
            if (data.toString().includes('listening')) {
                clearTimeout(timeout);
                resolve(child);
            }
        });

        child.stderr.on('data', (data) => {
            // Some environments print warnings on stderr — don't fail
            console.error(`[signaling stderr] ${data}`);
        });

        child.on('error', (err) => {
            clearTimeout(timeout);
            reject(err);
        });
    });
}

/** Connect a WebSocket client to the signaling server. */
function connectClient(port, session, token, role) {
    return new Promise((resolve, reject) => {
        const ws = new WebSocket(
            `ws://127.0.0.1:${port}/ws/signaling?session=${session}&token=${token}&role=${role}`,
        );
        ws.on('open', () => resolve(ws));
        ws.on('error', reject);
    });
}

/** Wait for the next message from a WebSocket. */
function nextMessage(ws, timeoutMs = 3000) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('Timed out waiting for message')), timeoutMs);
        ws.once('message', (data) => {
            clearTimeout(timer);
            resolve(JSON.parse(data.toString()));
        });
    });
}

describe('Signaling Server', () => {
    let serverProcess;

    afterAll(() => {
        if (serverProcess) {
            serverProcess.kill('SIGTERM');
        }
    });

    it('starts and listens on configured port', async () => {
        serverProcess = await startServer(TEST_PORT);
        expect(serverProcess.pid).toBeDefined();
    });

    it('rejects connections without required query params', async () => {
        if (!serverProcess) serverProcess = await startServer(TEST_PORT);

        const ws = new WebSocket(`ws://127.0.0.1:${TEST_PORT}/ws/signaling`);

        const closeCode = await new Promise((resolve) => {
            ws.on('close', (code) => resolve(code));
            ws.on('error', () => {}); // suppress error event
        });

        expect(closeCode).toBe(4000);
    });

    it('sends room-ready when both host and remote connect', async () => {
        if (!serverProcess) serverProcess = await startServer(TEST_PORT);

        const session = `test-session-${Date.now()}`;
        const token = 'test-token';

        const host = await connectClient(TEST_PORT, session, token, 'host');
        const hostMsg = nextMessage(host);

        const remote = await connectClient(TEST_PORT, session, token, 'remote');
        const remoteMsg = nextMessage(remote);

        const [hostReady, remoteReady] = await Promise.all([hostMsg, remoteMsg]);

        expect(hostReady.type).toBe('room-ready');
        expect(hostReady.yourRole).toBe('host');
        expect(remoteReady.type).toBe('room-ready');
        expect(remoteReady.yourRole).toBe('remote');

        host.close();
        remote.close();
    });

    it('relays messages between host and remote', async () => {
        if (!serverProcess) serverProcess = await startServer(TEST_PORT);

        const session = `relay-test-${Date.now()}`;
        const token = 'relay-token';

        const host = await connectClient(TEST_PORT, session, token, 'host');
        // Set up host room-ready listener BEFORE remote connects to avoid race
        const hostReady = nextMessage(host, 5000);

        const remote = await connectClient(TEST_PORT, session, token, 'remote');
        const remoteReady = nextMessage(remote, 5000);

        // Consume room-ready
        await Promise.all([hostReady, remoteReady]);

        // Small delay to ensure clean state after room-ready
        await new Promise((r) => setTimeout(r, 50));

        // Host sends an offer, remote should receive it
        const remoteMsg = nextMessage(remote, 5000);
        host.send(JSON.stringify({ type: 'offer', sdp: 'test-sdp' }));
        const received = await remoteMsg;

        expect(received.type).toBe('offer');
        expect(received.sdp).toBe('test-sdp');

        host.close();
        remote.close();
    });

    it('notifies when peer disconnects', async () => {
        if (!serverProcess) serverProcess = await startServer(TEST_PORT);

        const session = `disconnect-test-${Date.now()}`;
        const token = 'dc-token';

        const host = await connectClient(TEST_PORT, session, token, 'host');
        // Set up host room-ready listener BEFORE remote connects to avoid race
        const hostReady = nextMessage(host, 5000);

        const remote = await connectClient(TEST_PORT, session, token, 'remote');
        const remoteReady = nextMessage(remote, 5000);

        // Consume room-ready
        await Promise.all([hostReady, remoteReady]);

        // Remote will receive peer-disconnected when host closes
        const remoteDisconnectMsg = nextMessage(remote, 5000);
        host.close();
        const msg = await remoteDisconnectMsg;

        expect(msg.type).toBe('peer-disconnected');

        remote.close();
    });
});
