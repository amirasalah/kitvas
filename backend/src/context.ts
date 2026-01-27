import { PrismaClient } from '@prisma/client';
import type { Context as HonoContext } from 'hono';

const prisma = new PrismaClient();

export interface Context {
  prisma: PrismaClient;
  userId?: string; // Will be set when auth is implemented (Week 8)
  clientIp: string; // For rate limiting
}

// createContext for tRPC with Hono adapter
// The Hono adapter will call this with (opts, c) where c is the Hono context
export function createContext(_opts?: any, c?: HonoContext): Context {
  // Extract client IP from Hono context
  const clientIp = c?.req?.header('x-forwarded-for')?.split(',')[0]?.trim()
    || c?.req?.header('x-real-ip')
    || 'unknown';

  return {
    prisma,
    clientIp,
    // userId will be extracted from Hono context when auth is added
  };
}
