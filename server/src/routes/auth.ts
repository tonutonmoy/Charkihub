import type { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import { prisma } from '../db.js';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    /** MongoDB ObjectId string */
    payload: { sub: string; email: string; role: string };
  }
}

const P = '/api/v1';

const userResponseSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  countryCode: true,
  localArea: true,
  interests: true,
  locale: true,
  cvFormat: true,
  createdAt: true,
} as const;

export function registerAuthRoutes(app: FastifyInstance) {
  app.post<{
    Body: {
      email?: string;
      password?: string;
      name?: string;
      countryCode?: string;
      localArea?: string;
      interests?: string[];
    };
  }>(
    `${P}/register`,
    {
      config: {
        rateLimit: {
          max: 15,
          timeWindow: '15 minutes',
        },
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

      const b = req.body || {};
      const countryCode = String(b.countryCode || 'BD')
        .toUpperCase()
        .slice(0, 2);
      const localArea = b.localArea ? String(b.localArea).trim().slice(0, 200) : null;
      const interests = Array.isArray(b.interests)
        ? b.interests.map((x) => String(x).trim()).filter(Boolean).slice(0, 30)
        : [];

      const user = await prisma.user.create({
        data: {
          email: normalized,
          passwordHash,
          name: name.trim(),
          role: 'user',
          countryCode,
          localArea,
          interests,
        },
        select: userResponseSelect,
      });
      const token = app.jwt.sign({
        sub: user.id,
        email: normalized,
        role: 'user',
      });
      return reply.send({
        token,
        user,
      });
    }
  );

  app.post<{
    Body: { email?: string; password?: string };
  }>(
    `${P}/login`,
    {
      config: {
        rateLimit: {
          max: 30,
          timeWindow: '15 minutes',
        },
      },
    },
    async (req, reply) => {
      const { email, password } = req.body || {};
      if (!email || !password) {
        return reply.code(400).send({ error: 'email and password are required' });
      }
      const normalized = email.trim().toLowerCase();
      const row = await prisma.user.findUnique({ where: { email: normalized } });
      if (!row || !(await bcrypt.compare(password, row.passwordHash))) {
        return reply.code(401).send({ error: 'invalid email or password' });
      }
      const token = app.jwt.sign({
        sub: row.id,
        email: row.email,
        role: row.role,
      });
      const user = await prisma.user.findUnique({
        where: { id: row.id },
        select: userResponseSelect,
      });
      return reply.send({
        token,
        user,
      });
    }
  );

  app.get(`${P}/me`, { preHandler: [app.authenticate] }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const row = await prisma.user.findUnique({
      where: { id: sub },
      select: userResponseSelect,
    });
    if (!row) {
      return reply.code(404).send({ error: 'user not found' });
    }
    return { user: row };
  });
}
