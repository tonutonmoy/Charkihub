import { prisma } from './db.js';

/**
 * Legacy or hand-inserted MongoDB `users` docs may lack `createdAt` / `updatedAt`.
 * Prisma expects non-null DateTime — reads fail with P2032 until fixed.
 */
export async function fixLegacyUserTimestamps(): Promise<void> {
  try {
    const r1 = await prisma.$runCommandRaw({
      update: 'users',
      updates: [
        {
          q: { $or: [{ updatedAt: null }, { updatedAt: { $exists: false } }] },
          u: { $currentDate: { updatedAt: true } },
          multi: true,
        },
      ],
    });
    const r2 = await prisma.$runCommandRaw({
      update: 'users',
      updates: [
        {
          q: { $or: [{ createdAt: null }, { createdAt: { $exists: false } }] },
          u: { $currentDate: { createdAt: true } },
          multi: true,
        },
      ],
    });
    const n1 = (r1 as { nModified?: number }).nModified ?? 0;
    const n2 = (r2 as { nModified?: number }).nModified ?? 0;
    if (n1 > 0 || n2 > 0) {
      console.log(`[startup] Fixed legacy user timestamps (updatedAt: ${n1}, createdAt: ${n2})`);
    }
  } catch (e) {
    console.warn('[startup] fixLegacyUserTimestamps (non-fatal):', e);
  }
}
