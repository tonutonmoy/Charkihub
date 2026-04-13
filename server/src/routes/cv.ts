import type { FastifyInstance } from 'fastify';
import { Prisma } from '@prisma/client';
import { prisma } from '../db.js';

const P = '/api/v1';

export function registerCvRoutes(app: FastifyInstance) {
  app.get<{
    Params: { templateId: string };
  }>(
    `${P}/cv/:templateId`,
    { preHandler: [app.authenticate] },
    async (req, reply) => {
      const { sub } = req.user as { sub: string };
      const { templateId } = req.params;
      const draft = await prisma.cvDraft.findUnique({
        where: {
          userId_templateId: { userId: sub, templateId },
        },
      });
      if (!draft) {
        return reply.code(404).send({ error: 'no saved draft for this template' });
      }
      return { data: draft.data as Record<string, unknown> };
    }
  );

  app.put<{
    Params: { templateId: string };
    Body: Record<string, unknown>;
  }>(
    `${P}/cv/:templateId`,
    { preHandler: [app.authenticate] },
    async (req, reply) => {
      const { sub } = req.user as { sub: string };
      const { templateId } = req.params;
      const data = req.body;
      if (!data || typeof data !== 'object') {
        return reply.code(400).send({ error: 'invalid body' });
      }
      const json = data as Prisma.InputJsonValue;
      await prisma.cvDraft.upsert({
        where: {
          userId_templateId: { userId: sub, templateId },
        },
        create: {
          userId: sub,
          templateId,
          data: json,
        },
        update: { data: json },
      });
      return { ok: true };
    }
  );
}
