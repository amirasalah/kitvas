/**
 * Shared Prisma Client Singleton
 *
 * Limits connection pool to avoid exhausting Supabase's
 * PgBouncer Session mode pool (default ~15 connections).
 * With 3 Railway services sharing the pool, each service
 * should use at most 3-5 connections.
 */

import { PrismaClient } from '@prisma/client';

const CONNECTION_LIMIT = 5;

function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL || '';
  const separator = url.includes('?') ? '&' : '?';
  const urlWithLimit = url.includes('connection_limit')
    ? url
    : `${url}${separator}connection_limit=${CONNECTION_LIMIT}`;

  return new PrismaClient({
    datasources: {
      db: { url: urlWithLimit },
    },
  });
}

// Singleton for long-running processes (API server, scheduler daemon)
let instance: PrismaClient | null = null;

export function getPrisma(): PrismaClient {
  if (!instance) {
    instance = createPrismaClient();
  }
  return instance;
}

// For short-lived scripts (cron jobs) that need their own client.
// Lower limit since scripts are sequential and don't need many connections.
const SCRIPT_CONNECTION_LIMIT = 2;

export function createScriptPrisma(): PrismaClient {
  const url = process.env.DATABASE_URL || '';
  const separator = url.includes('?') ? '&' : '?';
  const urlWithLimit = url.includes('connection_limit')
    ? url
    : `${url}${separator}connection_limit=${SCRIPT_CONNECTION_LIMIT}`;

  return new PrismaClient({
    datasources: {
      db: { url: urlWithLimit },
    },
  });
}
