import type { FastifyInstance } from 'fastify';
import { prisma } from '../db.js';

const P = '/api/v1';
const TARGETS = ['job', 'blog', 'suggestion'] as const;

export function registerFavoriteRoutes(app: FastifyInstance) {
  app.get(`${P}/me/favorites`, { preHandler: [app.authenticate] }, async (req) => {
    const { sub } = req.user as { sub: string };
    const favs = await prisma.favorite.findMany({
      where: { userId: sub },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    const jobs = favs.filter((f) => f.targetType === 'job').map((f) => f.targetId);
    const blogs = favs.filter((f) => f.targetType === 'blog').map((f) => f.targetId);
    const sugs = favs.filter((f) => f.targetType === 'suggestion').map((f) => f.targetId);

    const [jobRows, blogRows, sugRows] = await Promise.all([
      jobs.length
        ? prisma.job.findMany({
            where: { id: { in: jobs }, status: 'published' },
          })
        : [],
      blogs.length ? prisma.blogPost.findMany({ where: { id: { in: blogs }, published: true } }) : [],
      sugs.length ? prisma.suggestion.findMany({ where: { id: { in: sugs } } }) : [],
    ]);

    const jobMap = new Map(jobRows.map((j) => [j.id, j]));
    const blogMap = new Map(blogRows.map((b) => [b.id, b]));
    const sugMap = new Map(sugRows.map((s) => [s.id, s]));

    const resolved = favs
      .map((f) => {
        if (f.targetType === 'job') {
          const j = jobMap.get(f.targetId);
          return j ? { type: 'job' as const, id: j.id, item: j } : null;
        }
        if (f.targetType === 'blog') {
          const b = blogMap.get(f.targetId);
          return b ? { type: 'blog' as const, id: b.id, item: b } : null;
        }
        const s = sugMap.get(f.targetId);
        return s ? { type: 'suggestion' as const, id: s.id, item: s } : null;
      })
      .filter(Boolean);

    return { favorites: resolved };
  });

  app.post<{
    Body: { targetType?: string; targetId?: string };
  }>(`${P}/favorites`, { preHandler: [app.authenticate] }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const { targetType, targetId } = req.body || {};
    if (!targetType || !targetId || !TARGETS.includes(targetType as (typeof TARGETS)[number])) {
      return reply.code(400).send({ error: 'targetType and targetId required' });
    }

    try {
      await prisma.favorite.create({
        data: {
          userId: sub,
          targetType,
          targetId: String(targetId),
        },
      });
    } catch {
      return reply.code(409).send({ error: 'already favorited' });
    }
    return { ok: true };
  });

  app.delete<{
    Querystring: { targetType?: string; targetId?: string };
  }>(`${P}/favorites`, { preHandler: [app.authenticate] }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const q = req.query;
    if (!q.targetType || !q.targetId || !TARGETS.includes(q.targetType as (typeof TARGETS)[number])) {
      return reply.code(400).send({ error: 'targetType and targetId required' });
    }

    const deleted = await prisma.favorite.deleteMany({
      where: {
        userId: sub,
        targetType: q.targetType,
        targetId: q.targetId,
      },
    });
    if (deleted.count === 0) return reply.code(404).send({ error: 'not found' });
    return { ok: true };
  });
}
