import type { FastifyInstance } from 'fastify';
import { prisma } from '../db.js';

const P = '/api/v1';

/** Public aggregates for marketing stats */
export function registerStatsRoutes(app: FastifyInstance) {
  app.get(`${P}/stats`, async () => {
    const [jobsPublished, activeUsers, examPrepActive] = await Promise.all([
      prisma.job.count({ where: { status: 'published' } }),
      prisma.user.count(),
      prisma.examPrepCategory.count({ where: { active: true } }),
    ]);

    let examsCovered = examPrepActive;
    try {
      const grouped = await prisma.job.groupBy({
        by: ['subCategory'],
        where: { status: 'published' },
      });
      if (grouped.length > 0) examsCovered = grouped.length;
    } catch {
      // Mongo / older Prisma: keep exam prep count
    }

    return { jobsPublished, activeUsers, examsCovered };
  });
}
