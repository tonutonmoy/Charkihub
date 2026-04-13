import type { FastifyInstance } from 'fastify';
import { prisma } from '../db.js';
import { ROLES, requireRole } from '../authz/requireRole.js';
import { getOptionalUserId } from '../authz/optionalAuth.js';
import { canManageSuggestions } from '../authz/adminPermissions.js';

const P = '/api/v1';

export function registerSuggestionRoutes(app: FastifyInstance) {
  const adminOrSuper = [app.authenticate, requireRole(ROLES.ADMIN, ROLES.SUPERADMIN)] as const;

  app.get<{
    Querystring: {
      country?: string;
      category?: string;
      search?: string;
      page?: string;
      limit?: string;
    };
  }>(`${P}/suggestions`, async (req) => {
    const q = req.query;
    const country = (q.country || 'BD').toUpperCase().slice(0, 2);
    const page = Math.max(1, parseInt(q.page || '1', 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(q.limit || '20', 10) || 20));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { countryCode: country };
    if (q.category?.trim()) where.category = q.category.trim();
    if (q.search?.trim()) {
      const s = q.search.trim();
      where.OR = [{ title: { contains: s } }, { summary: { contains: s } }];
    }

    const [items, total] = await Promise.all([
      prisma.suggestion.findMany({
        where,
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      prisma.suggestion.count({ where }),
    ]);

    const userId = await getOptionalUserId(req);
    let favSet = new Set<string>();
    if (userId && items.length) {
      const favs = await prisma.favorite.findMany({
        where: {
          userId,
          targetType: 'suggestion',
          targetId: { in: items.map((i) => i.id) },
        },
        select: { targetId: true },
      });
      favSet = new Set(favs.map((f) => f.targetId));
    }

    return {
      suggestions: items.map((i) => ({ ...i, favorited: favSet.has(i.id) })),
      page,
      limit,
      total,
    };
  });

  app.get<{ Params: { id: string } }>(`${P}/suggestions/:id`, async (req, reply) => {
    const s = await prisma.suggestion.findUnique({ where: { id: req.params.id } });
    if (!s) return reply.code(404).send({ error: 'not found' });

    const userId = await getOptionalUserId(req);
    let favorited = false;
    if (userId) {
      const f = await prisma.favorite.findUnique({
        where: {
          userId_targetType_targetId: {
            userId,
            targetType: 'suggestion',
            targetId: s.id,
          },
        },
      });
      favorited = !!f;
    }

    return { suggestion: { ...s, favorited } };
  });

  app.get(`${P}/admin/suggestions`, { preHandler: [...adminOrSuper] }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const admin = await prisma.user.findUnique({ where: { id: sub } });
    if (!admin || !canManageSuggestions(admin)) return reply.code(403).send({ error: 'forbidden' });

    const items = await prisma.suggestion.findMany({
      orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }],
      take: 500,
    });
    return { suggestions: items };
  });

  app.post<{ Body: Record<string, unknown> }>(
    `${P}/admin/suggestions`,
    { preHandler: [...adminOrSuper] },
    async (req, reply) => {
      const { sub } = req.user as { sub: string };
      const admin = await prisma.user.findUnique({ where: { id: sub } });
      if (!admin || !canManageSuggestions(admin)) return reply.code(403).send({ error: 'forbidden' });

      const b = req.body || {};
      const title = String(b.title || '').trim();
      const summary = String(b.summary || '').trim();
      const category = String(b.category || '').trim();
      const countryCode = String(b.countryCode || 'BD').toUpperCase().slice(0, 2);
      if (!title || !summary || !category) {
        return reply.code(400).send({ error: 'title, summary, category required' });
      }

      const item = await prisma.suggestion.create({
        data: {
          title,
          summary,
          category,
          countryCode,
          content: b.content ? String(b.content) : null,
          externalUrl: b.externalUrl ? String(b.externalUrl).trim() : null,
          sortOrder: typeof b.sortOrder === 'number' ? b.sortOrder : parseInt(String(b.sortOrder || '0'), 10) || 0,
        },
      });
      return { suggestion: item };
    }
  );

  app.patch<{
    Params: { id: string };
    Body: Record<string, unknown>;
  }>(`${P}/admin/suggestions/:id`, { preHandler: [...adminOrSuper] }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const admin = await prisma.user.findUnique({ where: { id: sub } });
    if (!admin || !canManageSuggestions(admin)) return reply.code(403).send({ error: 'forbidden' });

    const existing = await prisma.suggestion.findUnique({ where: { id: req.params.id } });
    if (!existing) return reply.code(404).send({ error: 'not found' });

    const b = req.body || {};
    const data: Record<string, unknown> = {};
    if (b.title !== undefined) data.title = String(b.title).trim();
    if (b.summary !== undefined) data.summary = String(b.summary).trim();
    if (b.category !== undefined) data.category = String(b.category).trim();
    if (b.countryCode !== undefined) data.countryCode = String(b.countryCode).toUpperCase().slice(0, 2);
    if (b.content !== undefined) data.content = b.content ? String(b.content) : null;
    if (b.externalUrl !== undefined) data.externalUrl = b.externalUrl ? String(b.externalUrl).trim() : null;
    if (b.sortOrder !== undefined) {
      data.sortOrder = typeof b.sortOrder === 'number' ? b.sortOrder : parseInt(String(b.sortOrder), 10) || 0;
    }

    const suggestion = await prisma.suggestion.update({
      where: { id: existing.id },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: data as any,
    });
    return { suggestion };
  });

  app.delete<{ Params: { id: string } }>(
    `${P}/admin/suggestions/:id`,
    { preHandler: [...adminOrSuper] },
    async (req, reply) => {
      const { sub } = req.user as { sub: string };
      const admin = await prisma.user.findUnique({ where: { id: sub } });
      if (!admin || !canManageSuggestions(admin)) return reply.code(403).send({ error: 'forbidden' });

      const existing = await prisma.suggestion.findUnique({ where: { id: req.params.id } });
      if (!existing) return reply.code(404).send({ error: 'not found' });
      await prisma.suggestion.delete({ where: { id: existing.id } });
      return { ok: true };
    }
  );
}
