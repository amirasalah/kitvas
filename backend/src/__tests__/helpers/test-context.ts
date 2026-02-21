import { PrismaClient } from '@prisma/client';
import { appRouter } from '../../router.js';
import { t } from '../../trpc.js';
import type { Context } from '../../context.js';

let prismaInstance: PrismaClient | null = null;

export function getPrisma(): PrismaClient {
  if (!prismaInstance) {
    prismaInstance = new PrismaClient();
  }
  return prismaInstance;
}

export async function disconnectPrisma(): Promise<void> {
  if (prismaInstance) {
    await prismaInstance.$disconnect();
    prismaInstance = null;
  }
}

export function createPublicCaller() {
  const createCaller = t.createCallerFactory(appRouter);
  const ctx: Context = {
    prisma: getPrisma(),
    userId: undefined,
    userEmail: undefined,
    clientIp: '127.0.0.1',
  };
  return createCaller(ctx);
}

export async function createAuthenticatedCaller() {
  const prisma = getPrisma();

  const testUser = await prisma.user.upsert({
    where: { email: 'test-e2e@kitvas.dev' },
    update: {},
    create: {
      email: 'test-e2e@kitvas.dev',
      name: 'E2E Test User',
    },
  });

  const createCaller = t.createCallerFactory(appRouter);
  const ctx: Context = {
    prisma,
    userId: testUser.id,
    userEmail: testUser.email,
    clientIp: '127.0.0.1',
  };
  return createCaller(ctx);
}
