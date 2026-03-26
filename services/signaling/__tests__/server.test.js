/**
 * Signaling Server Tests
 *
 * The signaling server starts a WebSocket server on import (top-level
 * `new WebSocketServer(...)`) so we cannot import it directly in tests
 * without side effects. These tests validate:
 *   1. Smoke tests (documentable expectations)
 *   2. WebSocket connection/relay behavior via child process spawn
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
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

/** Collect messages from a WebSocket into a buffer array. Returns a helper to wait for N messages. */
function createMessageCollector(ws) {
  const messages = [];
  const waiters = [];

  ws.on('message', (data) => {
    messages.push(JSON.parse(data.toString()));
    // Resolve any waiters that now have enough messages
    for (let i = waiters.length - 1; i >= 0; i--) {
      if (messages.length >= waiters[i].count) {
        waiters[i].resolve([...messages]);
        waiters.splice(i, 1);
      }
    }
  });

  return {
    messages,
    /** Wait until at least `count` messages have been received. */
    waitForCount(count, timeoutMs = 5000) {
      if (messages.length >= count) {
        return Promise.resolve([...messages]);
      }
      return new Promise((resolve, reject) => {
        const timer = setTimeout(
          () =>
            reject(new Error(`Timed out waiting for ${count} messages (got ${messages.length})`)),
          timeoutMs,
        );
        waiters.push({
          count,
          resolve: (msgs) => {
            clearTimeout(timer);
            resolve(msgs);
          },
        });
      });
    },
  };
}

describe('Signaling Server', () => {
  let serverProcess;

  beforeAll(async () => {
    serverProcess = await startServer(TEST_PORT);
  }, 10000);

  afterAll(() => {
    if (serverProcess) {
      serverProcess.kill('SIGTERM');
    }
  });

  it('starts and listens on configured port', () => {
    expect(serverProcess.pid).toBeDefined();
  });

  it('rejects connections without required query params', async () => {
    const ws = new WebSocket(`ws://127.0.0.1:${TEST_PORT}/ws/signaling`);

    const closeCode = await new Promise((resolve) => {
      ws.on('close', (code) => resolve(code));
      ws.on('error', () => {}); // suppress error event
    });

    expect(closeCode).toBe(4000);
  });

  it('sends room-ready when both host and remote connect', { timeout: 10000 }, async () => {
    const session = `test-session-${Date.now()}`;
    const token = 'test-token';

    const host = await connectClient(TEST_PORT, session, token, 'host');
    const hostCollector = createMessageCollector(host);

    const remote = await connectClient(TEST_PORT, session, token, 'remote');
    const remoteCollector = createMessageCollector(remote);

    const [hostMsgs, remoteMsgs] = await Promise.all([
      hostCollector.waitForCount(1),
      remoteCollector.waitForCount(1),
    ]);

    expect(hostMsgs[0].type).toBe('room-ready');
    expect(hostMsgs[0].yourRole).toBe('host');
    expect(remoteMsgs[0].type).toBe('room-ready');
    expect(remoteMsgs[0].yourRole).toBe('remote');

    host.close();
    remote.close();
  });

  it('relays messages between host and remote', { timeout: 10000 }, async () => {
    const session = `relay-test-${Date.now()}`;
    const token = 'relay-token';

    const host = await connectClient(TEST_PORT, session, token, 'host');
    const hostCollector = createMessageCollector(host);

    const remote = await connectClient(TEST_PORT, session, token, 'remote');
    const remoteCollector = createMessageCollector(remote);

    // Wait for room-ready on both sides
    await Promise.all([hostCollector.waitForCount(1), remoteCollector.waitForCount(1)]);

    // Host sends an offer, remote should receive it (as message #2)
    host.send(JSON.stringify({ type: 'offer', sdp: 'test-sdp' }));
    const remoteMsgs = await remoteCollector.waitForCount(2);

    expect(remoteMsgs[1].type).toBe('offer');
    expect(remoteMsgs[1].sdp).toBe('test-sdp');

    host.close();
    remote.close();
  });

  it('notifies when peer disconnects', { timeout: 10000 }, async () => {
    const session = `disconnect-test-${Date.now()}`;
    const token = 'dc-token';

    const host = await connectClient(TEST_PORT, session, token, 'host');
    const hostCollector = createMessageCollector(host);

    const remote = await connectClient(TEST_PORT, session, token, 'remote');
    const remoteCollector = createMessageCollector(remote);

    // Wait for room-ready
    await Promise.all([hostCollector.waitForCount(1), remoteCollector.waitForCount(1)]);

    // Close host — remote should get peer-disconnected (message #2)
    host.close();
    const remoteMsgs = await remoteCollector.waitForCount(2);

    expect(remoteMsgs[1].type).toBe('peer-disconnected');

    remote.close();
  });
});
