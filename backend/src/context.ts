import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface Context {
  prisma: PrismaClient;
  userId?: string; // Will be set when auth is implemented (Week 8)
}

// createContext for tRPC with Hono adapter
// The Hono adapter will call this with (opts, c) where c is the Hono context
export function createContext(_opts?: any, _c?: any): Context {
  return {
    prisma,
    // userId will be extracted from Hono context when auth is added
  };
}
