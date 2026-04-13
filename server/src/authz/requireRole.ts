import type { FastifyReply, FastifyRequest } from 'fastify';

/** Allowed role strings in DB and JWT */
export const ROLES = {
  SUPERADMIN: 'superadmin',
  ADMIN: 'admin',
  USER: 'user',
} as const;

export type AppRole = (typeof ROLES)[keyof typeof ROLES];

export function requireRole(...allowed: AppRole[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const u = request.user as { role?: string };
    if (!u?.role || !allowed.includes(u.role as AppRole)) {
      return reply.code(403).send({ error: 'forbidden' });
    }
  };
}
