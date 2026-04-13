import type { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import { prisma } from '../db.js';
import { ROLES, requireRole } from '../authz/requireRole.js';

const P = '/api/v1';

export function registerSuperAdminRoutes(app: FastifyInstance) {
  const superOnly = [app.authenticate, requireRole(ROLES.SUPERADMIN)] as const;

  app.post<{
    Body: { email?: string; password?: string; name?: string };
  }>(
    `${P}/superadmin/admins`,
    {
      preHandler: [...superOnly],
      config: {
        rateLimit: { max: 30, timeWindow: '15 minutes' },
      },
    },
    async (req, reply) => {
      const { email, password, name } = req.body || {};
      if (!email || !password || !name) {
        return reply.code(400).send({ error: 'email, password, and name are required' });
      }
      const normalized = email.trim().toLowerCase();
      if (password.length < 6) {
        return reply.code(400).send({ error: 'password must be at least 6 characters' });
      }
      const existing = await prisma.user.findUnique({ where: { email: normalized } });
      if (existing) {
        return reply.code(409).send({ error: 'email already registered' });
      }
      const passwordHash = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: {
          email: normalized,
          passwordHash,
          name: name.trim(),
          role: ROLES.ADMIN,
          permissions: {
            manageJobs: true,
            manageBlog: true,
            manageSuggestions: true,
            manageQBank: true,
            manageExamPrep: true,
          },
        },
      });
      return reply.send({
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
      });
    }
  );

  app.get(`${P}/superadmin/admins`, { preHandler: [...superOnly] }, async () => {
    const users = await prisma.user.findMany({
      where: { role: ROLES.ADMIN },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        permissions: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return { users };
  });

  app.patch<{
    Params: { id: string };
    Body: {
      permissions?: {
        manageJobs?: boolean;
        manageBlog?: boolean;
        manageSuggestions?: boolean;
        manageQBank?: boolean;
        manageExamPrep?: boolean;
      };
    };
  }>(`${P}/superadmin/admins/:id`, { preHandler: [...superOnly] }, async (req, reply) => {
    const target = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!target || target.role !== ROLES.ADMIN) {
      return reply.code(404).send({ error: 'admin not found' });
    }
    const perms = req.body?.permissions;
    if (!perms || typeof perms !== 'object') {
      return reply.code(400).send({ error: 'permissions object required' });
    }
    const user = await prisma.user.update({
      where: { id: target.id },
      data: {
        permissions: {
          manageJobs: perms.manageJobs !== false,
          manageBlog: perms.manageBlog !== false,
          manageSuggestions: perms.manageSuggestions !== false,
          manageQBank: perms.manageQBank !== false,
          manageExamPrep: perms.manageExamPrep !== false,
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        permissions: true,
        createdAt: true,
      },
    });
    return { user };
  });
}
