import type { FastifyInstance } from 'fastify';
import { prisma } from '../db.js';
import { ROLES, requireRole } from '../authz/requireRole.js';
import { getOptionalUserId } from '../authz/optionalAuth.js';
import { canManageJobs } from '../authz/adminPermissions.js';
import { deleteFileFromR2Safe } from '../services/r2Upload.js';

const P = '/api/v1';
const MAIN = ['government', 'private', 'local'] as const;

// ========== Helper: public fields (no attachments for list) ==========
function jobSelectPublic() {
  return {
    id: true,
    mainCategory: true,
    subCategory: true,
    countryCode: true,
    localArea: true,
    title: true,
    summary: true,
    organization: true,
    applyUrl: true,
    phone: true,
    startAt: true,
    endAt: true,
    pdfUrl: true,
    alertEnabled: true,
    alertMessage: true,
    status: true,
    likeCount: true,
    createdAt: true,
    updatedAt: true,
  } as const;
}

export function registerJobRoutes(app: FastifyInstance) {
  const adminOrSuper = [app.authenticate, requireRole(ROLES.ADMIN, ROLES.SUPERADMIN)] as const;

  // ========== PUBLIC ENDPOINTS (static before dynamic) ==========

  // 1. Filter options (static)
  app.get<{ Querystring: { country?: string; mainCategory?: string } }>(
    `${P}/jobs/filter-options`,
    async (req) => {
      const country = (req.query.country || 'BD').toUpperCase().slice(0, 2);
      const main = req.query.mainCategory;
      const where: Record<string, unknown> = { status: 'published', countryCode: country };
      if (main && MAIN.includes(main as typeof MAIN[number])) where.mainCategory = main;
      const rows = await prisma.job.findMany({ where, select: { subCategory: true, localArea: true } });
      const subFromJobs = [...new Set(rows.map(r => r.subCategory))];
      const areasFromJobs = rows.map(r => r.localArea).filter((a): a is string => Boolean(a && String(a).trim()));

      const dbSubWhere: Record<string, unknown> = { active: true, kind: 'sub_category', countryCode: country };
      if (main && MAIN.includes(main as typeof MAIN[number])) dbSubWhere.mainCategory = main;
      const dbSubs = await prisma.jobFilterOption.findMany({
        where: dbSubWhere as any,
        select: { value: true },
      });
      const dbCities = await prisma.jobFilterOption.findMany({
        where: { active: true, kind: 'city', countryCode: country },
        select: { value: true },
      });

      const subCategories = [...new Set([...dbSubs.map(d => d.value), ...subFromJobs])].sort();
      const localAreas = [...new Set([...dbCities.map(d => d.value), ...areasFromJobs])].sort();
      return { subCategories, localAreas };
    }
  );

  // 2. Top‑rated jobs (static – must come before :id)
  app.get<{
    Querystring: { country?: string; mainCategory?: string; limit?: string };
  }>(`${P}/jobs/top-rated`, async (req) => {
    const q = req.query;
    const country = (q.country || 'BD').toUpperCase().slice(0, 2);
    const limit = Math.min(20, Math.max(1, parseInt(q.limit || '6', 10) || 6));
    const where: Record<string, unknown> = {
      status: 'published',
      countryCode: country,
    };
    if (q.mainCategory && MAIN.includes(q.mainCategory as typeof MAIN[number])) {
      where.mainCategory = q.mainCategory;
    }

    const rows = await prisma.job.findMany({
      where,
      select: jobSelectPublic(),
      orderBy: [{ likeCount: 'desc' }, { createdAt: 'desc' }],
      take: limit,
    });

    const userId = await getOptionalUserId(req);
    let likedSet = new Set<string>();
    if (userId && rows.length) {
      const likes = await prisma.jobLike.findMany({
        where: { userId, jobId: { in: rows.map(r => r.id) } },
        select: { jobId: true },
      });
      likedSet = new Set(likes.map(l => l.jobId));
    }

    return { jobs: rows.map(j => ({ ...j, liked: likedSet.has(j.id) })) };
  });

  // 3. List jobs (paginated, filtered)
  app.get<{
    Querystring: {
      country?: string;
      mainCategory?: string;
      subCategory?: string;
      localArea?: string;
      search?: string;
      interestMatch?: string;
      matchUserLocation?: string;
      page?: string;
      limit?: string;
    };
  }>(`${P}/jobs`, async (req) => {
    const q = req.query;
    const country = (q.country || 'BD').toUpperCase().slice(0, 2);
    const page = Math.max(1, parseInt(q.page || '1', 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(q.limit || '20', 10) || 20));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      status: 'published',
      countryCode: country,
    };
    if (q.mainCategory && MAIN.includes(q.mainCategory as typeof MAIN[number])) {
      where.mainCategory = q.mainCategory;
    }

    const userId = await getOptionalUserId(req);
    const andParts: Record<string, unknown>[] = [];

    if (q.subCategory?.trim()) {
      andParts.push({ subCategory: { contains: q.subCategory.trim() } });
    }
    if (q.localArea?.trim()) {
      andParts.push({ localArea: { contains: q.localArea.trim() } });
    }
    if (q.interestMatch === '1' && userId) {
      const u = await prisma.user.findUnique({ where: { id: userId } });
      const tags = u?.interests?.map((t: string) => t.trim()).filter(Boolean) ?? [];
      if (tags.length) {
        andParts.push({ subCategory: { in: tags } });
      }
    }
    if (q.matchUserLocation === '1' && userId) {
      const u = await prisma.user.findUnique({ where: { id: userId } });
      const area = u?.localArea?.trim();
      if (area) {
        andParts.push({ localArea: { contains: area } });
      }
    }
    if (q.search?.trim()) {
      const s = q.search.trim();
      andParts.push({
        OR: [
          { title: { contains: s } },
          { organization: { contains: s } },
          { summary: { contains: s } },
        ],
      });
    }
    if (andParts.length) where.AND = andParts;

    const [rows, total] = await Promise.all([
      prisma.job.findMany({
        where,
        select: jobSelectPublic(),
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.job.count({ where }),
    ]);

    let likedSet = new Set<string>();
    if (userId && rows.length) {
      const likes = await prisma.jobLike.findMany({
        where: { userId, jobId: { in: rows.map(r => r.id) } },
        select: { jobId: true },
      });
      likedSet = new Set(likes.map(l => l.jobId));
    }

    return {
      jobs: rows.map(j => ({ ...j, liked: likedSet.has(j.id) })),
      page,
      limit,
      total,
    };
  });

  // 4. Single job – includes attachments
  app.get<{ Params: { id: string } }>(`${P}/jobs/:id`, async (req, reply) => {
    const job = await prisma.job.findUnique({
      where: { id: req.params.id },
      select: {
        ...jobSelectPublic(),
        description: true,
        attachments: true, // 👈 expose attachments for download button
      },
    });
    if (!job || job.status !== 'published') {
      return reply.code(404).send({ error: 'job not found' });
    }

    const userId = await getOptionalUserId(req);
    let liked = false;
    let favorited = false;
    if (userId) {
      const like = await prisma.jobLike.findUnique({
        where: { userId_jobId: { userId, jobId: job.id } },
      });
      liked = !!like;
      const fav = await prisma.favorite.findUnique({
        where: {
          userId_targetType_targetId: {
            userId,
            targetType: 'job',
            targetId: job.id,
          },
        },
      });
      favorited = !!fav;
    }

    return { job: { ...job, liked, favorited } };
  });

  // 5. Like / Unlike
  app.post<{ Params: { id: string } }>(
    `${P}/jobs/:id/like`,
    { preHandler: [app.authenticate] },
    async (req, reply) => {
      const { sub } = req.user as { sub: string };
      const job = await prisma.job.findUnique({ where: { id: req.params.id } });
      if (!job || job.status !== 'published') {
        return reply.code(404).send({ error: 'job not found' });
      }
      try {
        await prisma.$transaction([
          prisma.jobLike.create({ data: { userId: sub, jobId: job.id } }),
          prisma.job.update({ where: { id: job.id }, data: { likeCount: { increment: 1 } } }),
        ]);
      } catch {
        return reply.code(409).send({ error: 'already liked' });
      }
      const updated = await prisma.job.findUnique({ where: { id: job.id }, select: { likeCount: true } });
      return { ok: true, likeCount: updated?.likeCount ?? job.likeCount + 1 };
    }
  );

  app.delete<{ Params: { id: string } }>(
    `${P}/jobs/:id/like`,
    { preHandler: [app.authenticate] },
    async (req, reply) => {
      const { sub } = req.user as { sub: string };
      const job = await prisma.job.findUnique({ where: { id: req.params.id } });
      if (!job) return reply.code(404).send({ error: 'job not found' });
      const deleted = await prisma.jobLike.deleteMany({ where: { userId: sub, jobId: job.id } });
      if (deleted.count === 0) return reply.code(404).send({ error: 'not liked' });
      await prisma.job.update({ where: { id: job.id }, data: { likeCount: { decrement: 1 } } });
      const updated = await prisma.job.findUnique({ where: { id: job.id }, select: { likeCount: true } });
      return { ok: true, likeCount: Math.max(0, updated?.likeCount ?? 0) };
    }
  );

  // ========== ADMIN ENDPOINTS (with attachments & R2 deletion) ==========

  /** Admin: list jobs (includes attachments) */
  app.get<{ Querystring: { page?: string; limit?: string; search?: string; status?: string } }>(
    `${P}/admin/jobs`,
    { preHandler: [...adminOrSuper] },
    async (req, reply) => {
      const { sub } = req.user as { sub: string };
      const admin = await prisma.user.findUnique({ where: { id: sub } });
      if (!admin || !canManageJobs(admin)) {
        return reply.code(403).send({ error: 'forbidden' });
      }
      const q = req.query;
      const page = Math.max(1, parseInt(q.page || '1', 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(q.limit || '20', 10) || 20));
      const skip = (page - 1) * limit;
      const where: Record<string, unknown> = {};
      if (q.status === 'draft' || q.status === 'published') where.status = q.status;
      if (q.search?.trim()) {
        const s = q.search.trim();
        where.OR = [{ title: { contains: s } }, { organization: { contains: s } }];
      }
      const [jobs, total] = await Promise.all([
        prisma.job.findMany({
          where,
          orderBy: { updatedAt: 'desc' },
          skip,
          take: limit,
          select: {
            id: true,
            mainCategory: true,
            subCategory: true,
            countryCode: true,
            localArea: true,
            title: true,
            summary: true,
            description: true,
            organization: true,
            applyUrl: true,
            phone: true,
            startAt: true,
            endAt: true,
            pdfUrl: true,
            alertEnabled: true,
            alertMessage: true,
            status: true,
            attachments: true,   // includes the JSON array
            createdAt: true,
            updatedAt: true,
          },
        }),
        prisma.job.count({ where }),
      ]);
      return { jobs, page, limit, total };
    }
  );

  /** Admin: get single job (with attachments) */
  app.get<{ Params: { id: string } }>(
    `${P}/admin/jobs/:id`,
    { preHandler: [...adminOrSuper] },
    async (req, reply) => {
      const { sub } = req.user as { sub: string };
      const admin = await prisma.user.findUnique({ where: { id: sub } });
      if (!admin || !canManageJobs(admin)) {
        return reply.code(403).send({ error: 'forbidden' });
      }
      const job = await prisma.job.findUnique({ where: { id: req.params.id } });
      if (!job) return reply.code(404).send({ error: 'not found' });
      return { job };
    }
  );

  /** Admin: create job (with attachments) */
  app.post<{ Body: Record<string, unknown> }>(
    `${P}/admin/jobs`,
    { preHandler: [...adminOrSuper] },
    async (req, reply) => {
      const { sub } = req.user as { sub: string };
      const admin = await prisma.user.findUnique({ where: { id: sub } });
      if (!admin || !canManageJobs(admin)) {
        return reply.code(403).send({ error: 'forbidden' });
      }

      const b = req.body || {};
      const mainCategory = String(b.mainCategory || '').trim();
      const subCategory = String(b.subCategory || '').trim();
      const countryCode = String(b.countryCode || 'BD').toUpperCase().slice(0, 2);
      const title = String(b.title || '').trim();
      const summary = String(b.summary || '').trim();
      const organization = String(b.organization || '').trim();
      const startAt = b.startAt ? new Date(String(b.startAt)) : null;
      const endAt = b.endAt ? new Date(String(b.endAt)) : null;

      if (!MAIN.includes(mainCategory as typeof MAIN[number])) {
        return reply.code(400).send({ error: 'invalid mainCategory' });
      }
      if (!subCategory || !title || !summary || !organization || !startAt || !endAt || isNaN(startAt.getTime()) || isNaN(endAt.getTime())) {
        return reply.code(400).send({ error: 'missing required fields' });
      }

      let attachments = null;
      if (b.attachments && Array.isArray(b.attachments)) {
        attachments = b.attachments.map((att: any) => ({
          id: att.id,
          url: att.url,
          name: att.name,
          mimeType: att.mimeType,
          size: att.size,
        }));
      }

      const job = await prisma.job.create({
        data: {
          mainCategory,
          subCategory,
          countryCode,
          localArea: b.localArea ? String(b.localArea).trim() : null,
          title,
          summary,
          description: b.description ? String(b.description) : null,
          organization,
          applyUrl: b.applyUrl ? String(b.applyUrl).trim() : null,
          phone: b.phone ? String(b.phone).trim() : null,
          startAt,
          endAt,
          pdfUrl: b.pdfUrl ? String(b.pdfUrl).trim() : null,
          alertEnabled: Boolean(b.alertEnabled),
          alertMessage: b.alertMessage ? String(b.alertMessage) : null,
          status: b.status === 'draft' ? 'draft' : 'published',
          attachments: attachments as any,
        },
      });
      return { job };
    }
  );

  /** Admin: update job – automatically deletes removed attachments from R2 */
  app.patch<{ Params: { id: string }; Body: Record<string, unknown> }>(
    `${P}/admin/jobs/:id`,
    { preHandler: [...adminOrSuper] },
    async (req, reply) => {
      const { sub } = req.user as { sub: string };
      const admin = await prisma.user.findUnique({ where: { id: sub } });
      if (!admin || !canManageJobs(admin)) {
        return reply.code(403).send({ error: 'forbidden' });
      }

      const existing = await prisma.job.findUnique({ where: { id: req.params.id } });
      if (!existing) return reply.code(404).send({ error: 'not found' });

      const b = req.body || {};
      const data: Record<string, unknown> = {};

      // Basic fields
      if (b.mainCategory !== undefined) {
        const m = String(b.mainCategory).trim();
        if (!MAIN.includes(m as typeof MAIN[number])) return reply.code(400).send({ error: 'invalid mainCategory' });
        data.mainCategory = m;
      }
      if (b.subCategory !== undefined) data.subCategory = String(b.subCategory).trim();
      if (b.countryCode !== undefined) data.countryCode = String(b.countryCode).toUpperCase().slice(0, 2);
      if (b.localArea !== undefined) data.localArea = b.localArea ? String(b.localArea).trim() : null;
      if (b.title !== undefined) data.title = String(b.title).trim();
      if (b.summary !== undefined) data.summary = String(b.summary).trim();
      if (b.description !== undefined) data.description = b.description ? String(b.description) : null;
      if (b.organization !== undefined) data.organization = String(b.organization).trim();
      if (b.applyUrl !== undefined) data.applyUrl = b.applyUrl ? String(b.applyUrl).trim() : null;
      if (b.phone !== undefined) data.phone = b.phone ? String(b.phone).trim() : null;
      if (b.startAt !== undefined) {
        const d = new Date(String(b.startAt));
        if (isNaN(d.getTime())) return reply.code(400).send({ error: 'invalid startAt' });
        data.startAt = d;
      }
      if (b.endAt !== undefined) {
        const d = new Date(String(b.endAt));
        if (isNaN(d.getTime())) return reply.code(400).send({ error: 'invalid endAt' });
        data.endAt = d;
      }
      if (b.pdfUrl !== undefined) data.pdfUrl = b.pdfUrl ? String(b.pdfUrl).trim() : null;
      if (b.alertEnabled !== undefined) data.alertEnabled = Boolean(b.alertEnabled);
      if (b.alertMessage !== undefined) data.alertMessage = b.alertMessage ? String(b.alertMessage) : null;
      if (b.status !== undefined) data.status = b.status === 'draft' ? 'draft' : 'published';

      // Attachments handling: find removed ones and delete from R2
      const oldAttachments: Array<{ url: string }> = (existing.attachments as any) || [];
      let newAttachments: Array<{ url: string }> = [];
      if (b.attachments !== undefined) {
        if (Array.isArray(b.attachments)) {
          newAttachments = b.attachments.map((att: any) => ({
            id: att.id,
            url: att.url,
            name: att.name,
            mimeType: att.mimeType,
            size: att.size,
          }));
          data.attachments = newAttachments as any;
        } else {
          data.attachments = null;
        }
      }

      const oldUrls = new Set(oldAttachments.map(a => a.url));
      const newUrls = new Set(newAttachments.map(a => a.url));
      const removedUrls = [...oldUrls].filter(url => !newUrls.has(url));

      for (const url of removedUrls) {
        await deleteFileFromR2Safe(url); // delete from R2
      }

      const job = await prisma.job.update({
        where: { id: existing.id },
        data: data as any,
      });
      return { job };
    }
  );

  /** Admin: delete job – first delete all attachments from R2, then the job */
  app.delete<{ Params: { id: string } }>(
    `${P}/admin/jobs/:id`,
    { preHandler: [...adminOrSuper] },
    async (req, reply) => {
      const { sub } = req.user as { sub: string };
      const admin = await prisma.user.findUnique({ where: { id: sub } });
      if (!admin || !canManageJobs(admin)) {
        return reply.code(403).send({ error: 'forbidden' });
      }

      const existing = await prisma.job.findUnique({ where: { id: req.params.id } });
      if (!existing) return reply.code(404).send({ error: 'not found' });

      const attachments: Array<{ url: string }> = (existing.attachments as any) || [];
      for (const att of attachments) {
        await deleteFileFromR2Safe(att.url);
      }

      await prisma.job.delete({ where: { id: existing.id } });
      return { ok: true };
    }
  );
}