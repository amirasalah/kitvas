/**
 * SSE Broadcast Manager
 *
 * Manages Server-Sent Event connections and broadcasts updates
 * to all connected clients. Used for real-time trending ingredient updates.
 */

import type { SSEStreamingApi } from 'hono/streaming';

class SSEBroadcaster {
  private connections = new Map<string, SSEStreamingApi>();

  addConnection(id: string, stream: SSEStreamingApi): void {
    this.connections.set(id, stream);
    console.log(`[SSE] Client connected: ${id} (${this.connections.size} total)`);
  }

  removeConnection(id: string): void {
    this.connections.delete(id);
    console.log(`[SSE] Client disconnected: ${id} (${this.connections.size} total)`);
  }

  async broadcast(event: string, data: unknown): Promise<void> {
    const payload = JSON.stringify(data);
    const dead: string[] = [];

    for (const [id, stream] of this.connections) {
      try {
        await stream.writeSSE({ event, data: payload });
      } catch {
        dead.push(id);
      }
    }

    for (const id of dead) {
      this.connections.delete(id);
    }

    console.log(`[SSE] Broadcast "${event}" to ${this.connections.size} clients (${dead.length} cleaned up)`);
  }

  getConnectionCount(): number {
    return this.connections.size;
  }
}

export const broadcaster = new SSEBroadcaster();
