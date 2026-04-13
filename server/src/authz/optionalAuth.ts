import type { FastifyRequest } from 'fastify';

/** Returns JWT sub if valid Bearer token present; otherwise null. */
export async function getOptionalUserId(
  request: FastifyRequest
): Promise<string | null> {
  const auth = request.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return null;
  try {
    await request.jwtVerify();
    const u = request.user as { sub?: string };
    return u.sub ?? null;
  } catch {
    return null;
  }
}
