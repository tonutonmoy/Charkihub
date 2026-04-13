import type { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import { prisma } from '../db.js';
import { ROLES } from '../authz/requireRole.js';

const P = '/api/v1';

const publicUserFields = {
  id: true,
  email: true,
  name: true,
  role: true,
  countryCode: true,
  localArea: true,
  interests: true,
  locale: true,
  cvFormat: true,
  createdAt: true,
} as const;

export function registerUserProfileRoutes(app: FastifyInstance) {
  app.patch<{
    Body: {
      name?: string;
      countryCode?: string;
      localArea?: string | null;
      interests?: string[];
      locale?: string;
      cvFormat?: string | null;
    };
  }>(`${P}/me/profile`, { preHandler: [app.authenticate] }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const b = req.body || {};
    const data: Record<string, unknown> = {};

    if (b.name !== undefined) data.name = String(b.name).trim().slice(0, 120);
    if (b.countryCode !== undefined) data.countryCode = String(b.countryCode).toUpperCase().slice(0, 2);
    if (b.localArea !== undefined) data.localArea = b.localArea ? String(b.localArea).trim().slice(0, 200) : null;
    if (b.interests !== undefined) {
      data.interests = Array.isArray(b.interests)
        ? b.interests.map((x) => String(x).trim()).filter(Boolean).slice(0, 30)
        : [];
    }
    if (b.locale !== undefined) data.locale = String(b.locale).trim().slice(0, 10) || 'en';
    if (b.cvFormat !== undefined) {
      data.cvFormat = b.cvFormat ? String(b.cvFormat).trim().slice(0, 32) : null;
    }

    if (Object.keys(data).length === 0) {
      return reply.code(400).send({ error: 'no fields to update' });
    }

    const user = await prisma.user.update({
      where: { id: sub },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: data as any,
      select: publicUserFields,
    });
    return { user };
  });

  app.post<{
    Body: { currentPassword?: string; newPassword?: string };
  }>(`${P}/me/password`, { preHandler: [app.authenticate] }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword || String(newPassword).length < 6) {
      return reply.code(400).send({ error: 'current and new password (min 6 chars) required' });
    }

    const row = await prisma.user.findUnique({ where: { id: sub } });
    if (!row) return reply.code(404).send({ error: 'not found' });
    if (row.role === ROLES.SUPERADMIN) {
      return reply.code(403).send({ error: 'superadmin password cannot be changed here' });
    }
    if (!(await bcrypt.compare(String(currentPassword), row.passwordHash))) {
      return reply.code(401).send({ error: 'wrong password' });
    }

    const passwordHash = await bcrypt.hash(String(newPassword), 10);
    await prisma.user.update({ where: { id: sub }, data: { passwordHash } });
    return { ok: true };
  });

  app.get<{
    Querystring: { unread?: string };
  }>(`${P}/me/notifications`, { preHandler: [app.authenticate] }, async (req) => {
    const { sub } = req.user as { sub: string };
    const onlyUnread = req.query.unread === '1';
    const rows = await prisma.notification.findMany({
      where: { userId: sub, ...(onlyUnread ? { read: false } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return { notifications: rows };
  });

  app.patch<{ Params: { id: string } }>(
    `${P}/me/notifications/:id/read`,
    { preHandler: [app.authenticate] },
    async (req, reply) => {
      const { sub } = req.user as { sub: string };
      const n = await prisma.notification.findFirst({
        where: { id: req.params.id, userId: sub },
      });
      if (!n) return reply.code(404).send({ error: 'not found' });
      await prisma.notification.update({ where: { id: n.id }, data: { read: true } });
      return { ok: true };
    }
  );

  app.post(`${P}/me/notifications/read-all`, { preHandler: [app.authenticate] }, async (req) => {
    const { sub } = req.user as { sub: string };
    await prisma.notification.updateMany({
      where: { userId: sub, read: false },
      data: { read: true },
    });
    return { ok: true };
  });
}
