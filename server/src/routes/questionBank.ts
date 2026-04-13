import type { FastifyInstance } from 'fastify';
import { prisma } from '../db.js';
import { ROLES, requireRole } from '../authz/requireRole.js';
import { canManageQBank } from '../authz/adminPermissions.js';

const P = '/api/v1';

export function registerQuestionBankRoutes(app: FastifyInstance) {
  const adminOrSuper = [app.authenticate, requireRole(ROLES.ADMIN, ROLES.SUPERADMIN)] as const;

  app.get<{
    Querystring: { country?: string; category?: string; search?: string };
  }>(`${P}/qbank`, async (req) => {
    const country = (req.query.country || 'BD').toUpperCase().slice(0, 2);
    const category = (req.query.category || '').trim();
    const search = (req.query.search || '').trim();

    const where: Record<string, unknown> = {
      published: true,
      countryCode: country,
    };
    if (category) where.category = category;
    if (search) {
      where.OR = [{ title: { contains: search } }, { description: { contains: search } }];
    }

    const items = await prisma.questionBankItem.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      take: 200,
    });
    return { items };
  });

  app.get<{ Params: { id: string } }>(`${P}/qbank/:id`, async (req, reply) => {
    const item = await prisma.questionBankItem.findUnique({
      where: { id: req.params.id },
    });
    if (!item || !item.published) return reply.code(404).send({ error: 'not found' });
    return { item };
  });

  app.get(`${P}/admin/qbank`, { preHandler: [...adminOrSuper] }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const admin = await prisma.user.findUnique({ where: { id: sub } });
    if (!admin || !canManageQBank(admin)) return reply.code(403).send({ error: 'forbidden' });

    const items = await prisma.questionBankItem.findMany({
      orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }],
      take: 500,
    });
    return { items };
  });

  app.post<{ Body: Record<string, unknown> }>(
    `${P}/admin/qbank`,
    { preHandler: [...adminOrSuper] },
    async (req, reply) => {
      const { sub } = req.user as { sub: string };
      const admin = await prisma.user.findUnique({ where: { id: sub } });
      if (!admin || !canManageQBank(admin)) return reply.code(403).send({ error: 'forbidden' });

      const b = req.body || {};
      const title = String(b.title || '').trim();
      const category = String(b.category || '').trim();
      const year = String(b.year || '').trim();
      if (!title || !category || !year) {
        return reply.code(400).send({ error: 'title, category, year required' });
      }

      const item = await prisma.questionBankItem.create({
        data: {
          title,
          category,
          year,
          solved: b.solved !== false,
          description: b.description ? String(b.description).slice(0, 8000) : null,
          pdfUrl: b.pdfUrl ? String(b.pdfUrl).trim().slice(0, 2000) : null,
          countryCode: String(b.countryCode || 'BD').toUpperCase().slice(0, 2),
          sortOrder: Number(b.sortOrder) || 0,
          published: b.published !== false,
        },
      });
      return { item };
    }
  );

  app.patch<{
    Params: { id: string };
    Body: Record<string, unknown>;
  }>(`${P}/admin/qbank/:id`, { preHandler: [...adminOrSuper] }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const admin = await prisma.user.findUnique({ where: { id: sub } });
    if (!admin || !canManageQBank(admin)) return reply.code(403).send({ error: 'forbidden' });

    const existing = await prisma.questionBankItem.findUnique({ where: { id: req.params.id } });
    if (!existing) return reply.code(404).send({ error: 'not found' });

    const b = req.body || {};
    const data: Record<string, unknown> = {};
    if (b.title !== undefined) data.title = String(b.title).trim();
    if (b.category !== undefined) data.category = String(b.category).trim();
    if (b.year !== undefined) data.year = String(b.year).trim();
    if (b.solved !== undefined) data.solved = Boolean(b.solved);
    if (b.description !== undefined) data.description = b.description ? String(b.description).slice(0, 8000) : null;
    if (b.pdfUrl !== undefined) data.pdfUrl = b.pdfUrl ? String(b.pdfUrl).trim().slice(0, 2000) : null;
    if (b.countryCode !== undefined) data.countryCode = String(b.countryCode).toUpperCase().slice(0, 2);
    if (b.sortOrder !== undefined) data.sortOrder = Number(b.sortOrder) || 0;
    if (b.published !== undefined) data.published = Boolean(b.published);

    const item = await prisma.questionBankItem.update({
      where: { id: existing.id },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: data as any,
    });
    return { item };
  });

  app.delete<{ Params: { id: string } }>(
    `${P}/admin/qbank/:id`,
    { preHandler: [...adminOrSuper] },
    async (req, reply) => {
      const { sub } = req.user as { sub: string };
      const admin = await prisma.user.findUnique({ where: { id: sub } });
      if (!admin || !canManageQBank(admin)) return reply.code(403).send({ error: 'forbidden' });

      const existing = await prisma.questionBankItem.findUnique({ where: { id: req.params.id } });
      if (!existing) return reply.code(404).send({ error: 'not found' });
      await prisma.questionBankItem.delete({ where: { id: existing.id } });
      return { ok: true };
    }
  );
}
