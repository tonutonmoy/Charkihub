import type { FastifyInstance } from 'fastify';
import { prisma } from '../db.js';
import { ROLES, requireRole } from '../authz/requireRole.js';
import { getOptionalUserId } from '../authz/optionalAuth.js';
import { canManageBlog } from '../authz/adminPermissions.js';

const P = '/api/v1';

export function registerBlogRoutes(app: FastifyInstance) {
  const adminOrSuper = [app.authenticate, requireRole(ROLES.ADMIN, ROLES.SUPERADMIN)] as const;

  app.get<{
    Querystring: {
      country?: string;
      category?: string;
      search?: string;
      page?: string;
      limit?: string;
    };
  }>(`${P}/blog`, async (req) => {
    const q = req.query;
    const country = (q.country || 'BD').toUpperCase().slice(0, 2);
    const page = Math.max(1, parseInt(q.page || '1', 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(q.limit || '12', 10) || 12));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      published: true,
      countryCode: country,
    };
    if (q.category?.trim()) where.category = q.category.trim();
    if (q.search?.trim()) {
      const s = q.search.trim();
      where.OR = [{ title: { contains: s } }, { excerpt: { contains: s } }];
    }

    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          countryCode: true,
          category: true,
          published: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.blogPost.count({ where }),
    ]);

    const userId = await getOptionalUserId(req);
    let favSet = new Set<string>();
    if (userId && posts.length) {
      const favs = await prisma.favorite.findMany({
        where: {
          userId,
          targetType: 'blog',
          targetId: { in: posts.map((p) => p.id) },
        },
        select: { targetId: true },
      });
      favSet = new Set(favs.map((f) => f.targetId));
    }

    return {
      posts: posts.map((p) => ({ ...p, favorited: favSet.has(p.id) })),
      page,
      limit,
      total,
    };
  });

  app.get<{ Params: { id: string } }>(`${P}/blog/:id`, async (req, reply) => {
    const post = await prisma.blogPost.findUnique({
      where: { id: req.params.id },
    });
    if (!post || !post.published) {
      return reply.code(404).send({ error: 'not found' });
    }

    const userId = await getOptionalUserId(req);
    let favorited = false;
    if (userId) {
      const f = await prisma.favorite.findUnique({
        where: {
          userId_targetType_targetId: {
            userId,
            targetType: 'blog',
            targetId: post.id,
          },
        },
      });
      favorited = !!f;
    }

    return { post: { ...post, favorited } };
  });

  app.get(`${P}/admin/blog`, { preHandler: [...adminOrSuper] }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const admin = await prisma.user.findUnique({ where: { id: sub } });
    if (!admin || !canManageBlog(admin)) return reply.code(403).send({ error: 'forbidden' });

    const posts = await prisma.blogPost.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 200,
    });
    return { posts };
  });

  app.post<{ Body: Record<string, unknown> }>(
    `${P}/admin/blog`,
    { preHandler: [...adminOrSuper] },
    async (req, reply) => {
      const { sub } = req.user as { sub: string };
      const admin = await prisma.user.findUnique({ where: { id: sub } });
      if (!admin || !canManageBlog(admin)) return reply.code(403).send({ error: 'forbidden' });

      const b = req.body || {};
      const title = String(b.title || '').trim();
      const excerpt = String(b.excerpt || '').trim();
      const content = String(b.content || '').trim();
      const countryCode = String(b.countryCode || 'BD').toUpperCase().slice(0, 2);
      const category = String(b.category || 'general').trim();
      if (!title || !excerpt || !content) {
        return reply.code(400).send({ error: 'title, excerpt, content required' });
      }

      const post = await prisma.blogPost.create({
        data: {
          title,
          slug: b.slug ? String(b.slug).trim() : null,
          excerpt,
          content,
          countryCode,
          category,
          published: b.published !== false,
        },
      });
      return { post };
    }
  );

  app.patch<{
    Params: { id: string };
    Body: Record<string, unknown>;
  }>(`${P}/admin/blog/:id`, { preHandler: [...adminOrSuper] }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const admin = await prisma.user.findUnique({ where: { id: sub } });
    if (!admin || !canManageBlog(admin)) return reply.code(403).send({ error: 'forbidden' });

    const existing = await prisma.blogPost.findUnique({ where: { id: req.params.id } });
    if (!existing) return reply.code(404).send({ error: 'not found' });

    const b = req.body || {};
    const data: Record<string, unknown> = {};
    if (b.title !== undefined) data.title = String(b.title).trim();
    if (b.slug !== undefined) data.slug = b.slug ? String(b.slug).trim() : null;
    if (b.excerpt !== undefined) data.excerpt = String(b.excerpt).trim();
    if (b.content !== undefined) data.content = String(b.content).trim();
    if (b.countryCode !== undefined) data.countryCode = String(b.countryCode).toUpperCase().slice(0, 2);
    if (b.category !== undefined) data.category = String(b.category).trim();
    if (b.published !== undefined) data.published = Boolean(b.published);

    const post = await prisma.blogPost.update({
      where: { id: existing.id },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: data as any,
    });
    return { post };
  });

  app.delete<{ Params: { id: string } }>(
    `${P}/admin/blog/:id`,
    { preHandler: [...adminOrSuper] },
    async (req, reply) => {
      const { sub } = req.user as { sub: string };
      const admin = await prisma.user.findUnique({ where: { id: sub } });
      if (!admin || !canManageBlog(admin)) return reply.code(403).send({ error: 'forbidden' });

      const existing = await prisma.blogPost.findUnique({ where: { id: req.params.id } });
      if (!existing) return reply.code(404).send({ error: 'not found' });
      await prisma.blogPost.delete({ where: { id: existing.id } });
      return { ok: true };
    }
  );
}
