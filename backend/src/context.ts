import { PrismaClient } from '@prisma/client';
import { jwtDecrypt } from 'jose';
import { hkdf } from 'node:crypto';
import { promisify } from 'node:util';
import type { Context as HonoContext } from 'hono';
import { logger } from './lib/logger.js';

const prisma = new PrismaClient();
const hkdfAsync = promisify(hkdf);

// Cache the derived encryption key
let encryptionKeyPromise: Promise<Uint8Array> | null = null;

async function getDerivedEncryptionKey(): Promise<Uint8Array> {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error('AUTH_SECRET is not set');

  return new Uint8Array(
    await hkdfAsync(
      'sha256',
      secret,
      '',
      'Auth.js Generated Encryption Key',
      64
    )
  );
}

function getEncryptionKey(): Promise<Uint8Array> {
  if (!encryptionKeyPromise) {
    encryptionKeyPromise = getDerivedEncryptionKey();
  }
  return encryptionKeyPromise;
}

interface JWTPayload {
  sub?: string;
  email?: string;
  name?: string;
  picture?: string;
  [key: string]: unknown;
}

/**
 * Verify and decode a NextAuth v5 encrypted JWT token.
 * Returns the decoded payload or null if invalid/expired.
 */
async function verifyNextAuthToken(token: string): Promise<JWTPayload | null> {
  try {
    const key = await getEncryptionKey();
    const { payload } = await jwtDecrypt(token, key, {
      clockTolerance: 15,
    });
    return payload as JWTPayload;
  } catch {
    return null;
  }
}

/**
 * Find or create a user from the JWT payload.
 * Called on first authenticated request to bridge NextAuth user to backend DB.
 */
async function findOrCreateUser(payload: JWTPayload): Promise<string | undefined> {
  const email = payload.email;
  if (!email) return undefined;

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name: payload.name || undefined,
      image: payload.picture || undefined,
    },
    create: {
      email,
      name: payload.name || null,
      image: payload.picture || null,
    },
    select: { id: true },
  });

  return user.id;
}

export interface Context {
  prisma: PrismaClient;
  userId?: string;
  userEmail?: string;
  clientIp: string;
}

// createContext for tRPC with Hono adapter
export async function createContext(_opts?: any, c?: HonoContext): Promise<Context> {
  // Extract client IP from Hono context
  const clientIp = c?.req?.header('x-forwarded-for')?.split(',')[0]?.trim()
    || c?.req?.header('x-real-ip')
    || 'unknown';

  let userId: string | undefined;
  let userEmail: string | undefined;

  // Extract and verify auth token
  const authHeader = c?.req?.header('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const payload = await verifyNextAuthToken(token);

    if (payload?.email) {
      userEmail = payload.email;
      try {
        userId = await findOrCreateUser(payload);
      } catch (error) {
        logger.error('Failed to find/create user', {
          email: payload.email,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  return {
    prisma,
    userId,
    userEmail,
    clientIp,
  };
}
