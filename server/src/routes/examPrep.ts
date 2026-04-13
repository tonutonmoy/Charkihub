import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '../db.js';
import { ROLES, requireRole } from '../authz/requireRole.js';
import { canManageExamPrep } from '../authz/adminPermissions.js';

const P = '/api/v1';

export function registerExamPrepRoutes(app: FastifyInstance) {
  const manageExamPrep = [
    app.authenticate,
    requireRole(ROLES.ADMIN, ROLES.SUPERADMIN),
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { sub } = req.user as { sub: string };
      const u = await prisma.user.findUnique({ where: { id: sub } });
      if (!u || !canManageExamPrep(u)) {
        return reply.code(403).send({ error: 'forbidden' });
      }
    },
  ] as const;

  app.get<{
    Querystring: { country?: string };
  }>(`${P}/exam-prep/categories`, async (req) => {
    const country = (req.query.country || 'BD').toUpperCase().slice(0, 2);
    const rows = await prisma.examPrepCategory.findMany({
      where: { countryCode: country, active: true },
      orderBy: { sortOrder: 'asc' },
    });
    return {
      categories: rows.map((c) => ({
        id: c.id,
        label: c.label,
        slug: c.slug,
        countryCode: c.countryCode,
      })),
    };
  });

  app.get<{
    Querystring: { country?: string; categoryId?: string; search?: string };
  }>(`${P}/exam-prep/courses`, async (req) => {
    const country = (req.query.country || 'BD').toUpperCase().slice(0, 2);
    const categoryId = req.query.categoryId?.trim();
    const search = (req.query.search || '').trim();

    const courses = await prisma.examPrepCourse.findMany({
      where: {
        published: true,
        ...(categoryId ? { categoryId } : {}),
        category: {
          countryCode: country,
          active: true,
        },
        ...(search ? { title: { contains: search } } : {}),
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      take: 100,
      include: { category: { select: { id: true, label: true, slug: true } } },
    });

    return {
      courses: courses.map((c) => ({
        id: c.id,
        title: c.title,
        description: c.description,
        category: c.category,
        lessons: c.lessons,
        duration: c.duration,
        rating: c.rating,
        price: c.price,
        createdAt: c.createdAt,
      })),
    };
  });

  app.get<{ Params: { id: string } }>(`${P}/exam-prep/courses/:id`, async (req, reply) => {
    const c = await prisma.examPrepCourse.findUnique({
      where: { id: req.params.id },
      include: { category: true },
    });
    if (!c || !c.published) return reply.code(404).send({ error: 'not found' });
    return {
      course: {
        id: c.id,
        title: c.title,
        description: c.description,
        lessons: c.lessons,
        duration: c.duration,
        rating: c.rating,
        price: c.price,
        createdAt: c.createdAt,
        category: { id: c.category.id, label: c.category.label, slug: c.category.slug },
      },
    };
  });

  /** Superadmin: categories */
  app.get<{
    Querystring: { country?: string };
  }>(`${P}/superadmin/exam-prep/categories`, { preHandler: [...manageExamPrep] }, async (req) => {
    const country = (req.query.country || '').trim();
    const rows = await prisma.examPrepCategory.findMany({
      where: country ? { countryCode: country } : {},
      orderBy: [{ countryCode: 'asc' }, { sortOrder: 'asc' }],
    });
    return { categories: rows };
  });

  app.post<{
    Body: { label?: string; slug?: string; countryCode?: string; sortOrder?: number; active?: boolean };
  }>(`${P}/superadmin/exam-prep/categories`, { preHandler: [...manageExamPrep] }, async (req, reply) => {
    const label = String(req.body?.label || '').trim();
    let slug = String(req.body?.slug || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    if (!slug) slug = `cat-${Date.now().toString(36)}`;
    const countryCode = (req.body?.countryCode || 'BD').toUpperCase().slice(0, 2);
    if (label.length < 1) {
      return reply.code(400).send({ error: 'label required' });
    }
    const c = await prisma.examPrepCategory.create({
      data: {
        label,
        slug,
        countryCode,
        sortOrder: Number(req.body?.sortOrder) || 0,
        active: req.body?.active !== false,
      },
    });
    return { category: c };
  });

  app.patch<{
    Params: { id: string };
    Body: Partial<{ label: string; slug: string; sortOrder: number; active: boolean }>;
  }>(`${P}/superadmin/exam-prep/categories/:id`, { preHandler: [...manageExamPrep] }, async (req, reply) => {
    const b = req.body || {};
    const data: Record<string, unknown> = {};
    if (b.label !== undefined) data.label = String(b.label).trim();
    if (b.slug !== undefined) data.slug = String(b.slug).trim().toLowerCase().replace(/\s+/g, '-');
    if (b.sortOrder !== undefined) data.sortOrder = Number(b.sortOrder);
    if (b.active !== undefined) data.active = Boolean(b.active);
    const c = await prisma.examPrepCategory.update({
      where: { id: req.params.id },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: data as any,
    });
    return { category: c };
  });

  app.delete<{ Params: { id: string } }>(
    `${P}/superadmin/exam-prep/categories/:id`,
    { preHandler: [...manageExamPrep] },
    async (req) => {
      await prisma.examPrepCourse.deleteMany({ where: { categoryId: req.params.id } });
      await prisma.examPrepCategory.delete({ where: { id: req.params.id } });
      return { ok: true };
    }
  );

  /** Superadmin: courses */
  app.get<{
    Querystring: { categoryId?: string };
  }>(`${P}/superadmin/exam-prep/courses`, { preHandler: [...manageExamPrep] }, async (req) => {
    const categoryId = req.query.categoryId?.trim();
    const rows = await prisma.examPrepCourse.findMany({
      where: categoryId ? { categoryId } : {},
      orderBy: { sortOrder: 'asc' },
      include: { category: true },
    });
    return { courses: rows };
  });

  app.post<{
    Body: Record<string, unknown>;
  }>(`${P}/superadmin/exam-prep/courses`, { preHandler: [...manageExamPrep] }, async (req, reply) => {
    const b = req.body || {};
    const categoryId = String(b.categoryId || '');
    const title = String(b.title || '').trim();
    if (!categoryId || title.length < 1) {
      return reply.code(400).send({ error: 'categoryId and title required' });
    }
    const cat = await prisma.examPrepCategory.findUnique({ where: { id: categoryId } });
    if (!cat) return reply.code(400).send({ error: 'invalid category' });

    const c = await prisma.examPrepCourse.create({
      data: {
        categoryId,
        title,
        description: b.description ? String(b.description).slice(0, 4000) : null,
        lessons: Math.max(0, Number(b.lessons) || 0),
        duration: b.duration ? String(b.duration).slice(0, 64) : '',
        rating: Math.min(5, Math.max(0, Number(b.rating) || 0)),
        price: b.price ? String(b.price).slice(0, 64) : 'Free',
        sortOrder: Number(b.sortOrder) || 0,
        published: b.published !== false,
      },
    });
    return { course: c };
  });

  app.patch<{
    Params: { id: string };
    Body: Record<string, unknown>;
  }>(`${P}/superadmin/exam-prep/courses/:id`, { preHandler: [...manageExamPrep] }, async (req) => {
    const b = req.body || {};
    const data: Record<string, unknown> = {};
    if (b.title !== undefined) data.title = String(b.title).trim();
    if (b.description !== undefined) data.description = b.description ? String(b.description).slice(0, 4000) : null;
    if (b.lessons !== undefined) data.lessons = Math.max(0, Number(b.lessons) || 0);
    if (b.duration !== undefined) data.duration = String(b.duration).slice(0, 64);
    if (b.rating !== undefined) data.rating = Math.min(5, Math.max(0, Number(b.rating) || 0));
    if (b.price !== undefined) data.price = String(b.price).slice(0, 64);
    if (b.sortOrder !== undefined) data.sortOrder = Number(b.sortOrder);
    if (b.published !== undefined) data.published = Boolean(b.published);
    const c = await prisma.examPrepCourse.update({
      where: { id: req.params.id },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: data as any,
    });
    return { course: c };
  });

  app.delete<{ Params: { id: string } }>(
    `${P}/superadmin/exam-prep/courses/:id`,
    { preHandler: [...manageExamPrep] },
    async (req) => {
      await prisma.examPrepCourse.delete({ where: { id: req.params.id } });
      return { ok: true };
    }
  );
}
