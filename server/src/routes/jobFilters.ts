import type { FastifyInstance } from 'fastify';
import { prisma } from '../db.js';
import { ROLES, requireRole } from '../authz/requireRole.js';

const P = '/api/v1';

const KINDS = ['country', 'city', 'main_category', 'sub_category'] as const;
const MAINS = ['government', 'private', 'local'] as const;

function isKind(s: string): s is (typeof KINDS)[number] {
  return KINDS.includes(s as (typeof KINDS)[number]);
}

function isMain(s: string): s is (typeof MAINS)[number] {
  return MAINS.includes(s as (typeof MAINS)[number]);
}

function normalizeCountry(code: string | undefined): string {
  return (code || '').toUpperCase().slice(0, 2);
}

/** Public: grouped filter definitions for the jobs UI */
export function registerJobFilterRoutes(app: FastifyInstance) {
  app.get<{
    Querystring: { country?: string };
  }>(`${P}/job-filters`, async () => {
    const rows = await prisma.jobFilterOption.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }],
    });

    const countries = rows
      .filter((r) => r.kind === 'country')
      .map((r) => ({ value: r.value, label: r.label }));

    const mainCategories = rows
      .filter((r) => r.kind === 'main_category')
      .map((r) => ({ value: r.value, label: r.label }));

    const citiesByCountry: Record<string, { value: string; label: string }[]> = {};
    for (const r of rows.filter((x) => x.kind === 'city')) {
      const cc = r.countryCode;
      if (!citiesByCountry[cc]) citiesByCountry[cc] = [];
      citiesByCountry[cc].push({ value: r.value, label: r.label });
    }

    const subCategoriesByCountry: Record<string, Record<string, { value: string; label: string }[]>> = {};
    for (const r of rows.filter((x) => x.kind === 'sub_category')) {
      const cc = r.countryCode;
      if (!subCategoriesByCountry[cc]) subCategoriesByCountry[cc] = {};
      const m = r.mainCategory;
      if (!subCategoriesByCountry[cc][m]) subCategoriesByCountry[cc][m] = [];
      subCategoriesByCountry[cc][m].push({ value: r.value, label: r.label });
    }

    return {
      countries,
      mainCategories,
      citiesByCountry,
      subCategoriesByCountry,
    };
  });

  const superOnly = [app.authenticate, requireRole(ROLES.SUPERADMIN)] as const;

  app.get<{
    Querystring: { kind?: string; countryCode?: string };
  }>(`${P}/superadmin/job-filters`, { preHandler: [...superOnly] }, async (req) => {
    const where: Record<string, unknown> = {};
    if (req.query.kind && isKind(req.query.kind)) where.kind = req.query.kind;
    if (req.query.countryCode !== undefined) {
      where.countryCode = normalizeCountry(req.query.countryCode) || '';
    }
    const items = await prisma.jobFilterOption.findMany({
      where,
      orderBy: [{ kind: 'asc' }, { countryCode: 'asc' }, { mainCategory: 'asc' }, { sortOrder: 'asc' }, { label: 'asc' }],
    });
    return { items };
  });

  app.post<{
    Body: {
      kind?: string;
      countryCode?: string;
      mainCategory?: string;
      value?: string;
      label?: string;
      sortOrder?: number;
      active?: boolean;
    };
  }>(`${P}/superadmin/job-filters`, { preHandler: [...superOnly] }, async (req, reply) => {
    const b = req.body || {};
    if (!b.kind || !isKind(b.kind)) {
      return reply.code(400).send({ error: 'kind must be country | city | main_category | sub_category' });
    }
    const value = String(b.value || '').trim();
    const label = String(b.label || '').trim();
    if (!value || !label) {
      return reply.code(400).send({ error: 'value and label are required' });
    }
    const countryCode = normalizeCountry(b.countryCode) || '';
    let mainCategory = String(b.mainCategory || '').trim();
    if (b.kind === 'sub_category') {
      if (!countryCode) {
        return reply.code(400).send({ error: 'countryCode is required for sub_category' });
      }
      if (!mainCategory || !isMain(mainCategory)) {
        return reply.code(400).send({ error: 'mainCategory must be government | private | local' });
      }
    } else {
      mainCategory = '';
    }
    if (b.kind === 'city' && !countryCode) {
      return reply.code(400).send({ error: 'countryCode is required for city' });
    }
    if (b.kind === 'country') {
      if (countryCode.length !== 2) {
        return reply.code(400).send({ error: 'use value as ISO country code (e.g. BD)' });
      }
    }

    const sortOrder = typeof b.sortOrder === 'number' && Number.isFinite(b.sortOrder) ? (b.sortOrder as number) : 0;
    const active = b.active !== false;

    const finalCountry = b.kind === 'country' ? '' : countryCode;
    const finalValue = b.kind === 'country' ? normalizeCountry(value) || value : value;

    try {
      const row = await prisma.jobFilterOption.create({
        data: {
          kind: b.kind,
          countryCode: finalCountry,
          mainCategory: b.kind === 'sub_category' ? mainCategory : '',
          value: finalValue,
          label,
          sortOrder,
          active,
        },
      });
      return { item: row };
    } catch (e) {
      req.log.error({ err: e }, 'create job filter');
      return reply.code(409).send({ error: 'duplicate or invalid (check kind, country, main, value)' });
    }
  });

  app.patch<{
    Params: { id: string };
    Body: {
      label?: string;
      sortOrder?: number;
      active?: boolean;
      value?: string;
      countryCode?: string;
      mainCategory?: string;
    };
  }>(`${P}/superadmin/job-filters/:id`, { preHandler: [...superOnly] }, async (req, reply) => {
    const existing = await prisma.jobFilterOption.findUnique({ where: { id: req.params.id } });
    if (!existing) return reply.code(404).send({ error: 'not found' });

    const b = req.body || {};
    const data: Record<string, unknown> = {};
    if (b.label !== undefined) data.label = String(b.label).trim();
    if (b.sortOrder !== undefined) data.sortOrder = Number(b.sortOrder);
    if (b.active !== undefined) data.active = Boolean(b.active);
    if (b.value !== undefined) data.value = String(b.value).trim();
    if (b.countryCode !== undefined) data.countryCode = normalizeCountry(b.countryCode) || '';
    if (b.mainCategory !== undefined) {
      const m = String(b.mainCategory).trim();
      data.mainCategory = existing.kind === 'sub_category' && m ? m : '';
    }

    try {
      const item = await prisma.jobFilterOption.update({
        where: { id: req.params.id },
        data: data as Record<string, string | number | boolean>,
      });
      return { item };
    } catch (e) {
      req.log.error({ err: e }, 'update job filter');
      return reply.code(409).send({ error: 'update conflict or duplicate' });
    }
  });

  app.delete<{ Params: { id: string } }>(`${P}/superadmin/job-filters/:id`, { preHandler: [...superOnly] }, async (req, reply) => {
    const existing = await prisma.jobFilterOption.findUnique({ where: { id: req.params.id } });
    if (!existing) return reply.code(404).send({ error: 'not found' });
    await prisma.jobFilterOption.delete({ where: { id: req.params.id } });
    return { ok: true };
  });
}
