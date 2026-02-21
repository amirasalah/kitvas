/**
 * SSE Broadcast Manager
 *
 * Manages Server-Sent Event connections and broadcasts updates
 * to all connected clients. Used for real-time trending ingredient updates.
 */

import type { SSEStreamingApi } from 'hono/streaming';
import { logger } from './logger.js';

class SSEBroadcaster {
  private connections = new Map<string, SSEStreamingApi>();

  addConnection(id: string, stream: SSEStreamingApi): void {
    this.connections.set(id, stream);
    logger.debug(`SSE client connected: ${id}`, { total: this.connections.size });
  }

  removeConnection(id: string): void {
    this.connections.delete(id);
    logger.debug(`SSE client disconnected: ${id}`, { total: this.connections.size });
  }

  async broadcast(event: string, data: unknown): Promise<void> {
    const payload = JSON.stringify(data);
    const dead: string[] = [];

    for (const [id, stream] of this.connections) {
      try {
        await stream.writeSSE({ event, data: payload });
      } catch (err) {
        logger.warn(`SSE connection ${id} failed: ${err instanceof Error ? err.message : 'unknown error'}`);
        dead.push(id);
      }
    }

    for (const id of dead) {
      this.connections.delete(id);
    }

    logger.info(`SSE broadcast "${event}"`, { clients: this.connections.size, cleaned: dead.length });
  }

  getConnectionCount(): number {
    return this.connections.size;
  }
}

export const broadcaster = new SSEBroadcaster();
