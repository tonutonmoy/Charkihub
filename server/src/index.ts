import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyJwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from './db.js';

import { ensureSuperAdmin } from './ensureSuperAdmin.js';
import { fixLegacyUserTimestamps } from './fixLegacyUserTimestamps.js';

import { registerAuthRoutes } from './routes/auth.js';
import { registerCvRoutes } from './routes/cv.js';
import { registerUploadRoutes } from './routes/upload.js';
import { registerSuperAdminRoutes } from './routes/superAdmin.js';
import { registerJobFilterRoutes } from './routes/jobFilters.js';
import { registerJobRoutes } from './routes/jobs.js';
import { registerBlogRoutes } from './routes/blog.js';
import { registerSuggestionRoutes } from './routes/suggestions.js';
import { registerFavoriteRoutes } from './routes/favorites.js';
import { registerCommentRoutes } from './routes/comments.js';
import { registerUserProfileRoutes } from './routes/userProfile.js';
import { registerFileRoutes, ensureUploadDir } from './routes/files.js';
import { registerExamPrepRoutes } from './routes/examPrep.js';
import { registerSocialRoutes } from './routes/social.js';
import { registerGroupRoutes } from './routes/groups.js';
import { registerMessageRoutes } from './routes/messages.js';
import { registerStatsRoutes } from './routes/stats.js';
import { registerQuestionBankRoutes } from './routes/questionBank.js';

const PORT = Number(process.env.PORT) || 3006;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-change-in-production';

const TRUST_PROXY =
  process.env.TRUST_PROXY === '1' ||
  process.env.NODE_ENV === 'production';

// ✅ allowed origin
const FRONTEND_ORIGIN = "https://chakrihub.tonusoft.com";

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

const app = Fastify({
  logger: true,
  trustProxy: TRUST_PROXY,
  bodyLimit: 20 * 1024 * 1024,
  requestIdHeader: 'x-request-id',
  genReqId: () => randomUUID(),
});


// ==========================
// ✅ GLOBAL CORS (SAFE)
// ==========================
await app.register(cors, {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);

    const cleanOrigin = origin.replace(/\/$/, '');

    if (cleanOrigin === FRONTEND_ORIGIN) {
      return cb(null, true);
    }

    return cb(null, false);
  },
  credentials: true,
});


// ==========================
// ✅ FORCE CORS HEADERS (FIX ALL ISSUES)
// ==========================
app.addHook('onSend', async (req, reply, payload) => {
  reply.header('Access-Control-Allow-Origin', FRONTEND_ORIGIN);
  reply.header('Access-Control-Allow-Credentials', 'true');
  reply.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  reply.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return payload;
});


// ==========================
// ✅ HANDLE PREFLIGHT (IMPORTANT)
// ==========================
app.options('*', async (req, reply) => {
  reply
    .header('Access-Control-Allow-Origin', FRONTEND_ORIGIN)
    .header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
    .header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    .code(204)
    .send();
});


// ==========================
// ✅ RATE LIMIT
// ==========================
await app.register(rateLimit, {
  global: true,
  max: 800,
  timeWindow: '1 minute',
});


// ==========================
// ✅ JWT
// ==========================
await app.register(fastifyJwt, {
  secret: JWT_SECRET,
  sign: { expiresIn: '14d' },
});


// ==========================
// ✅ AUTH DECORATOR
// ==========================
app.decorate(
  'authenticate',
  async function (request: FastifyRequest, reply: FastifyReply) {
    try {
      await request.jwtVerify();
    } catch {
      return reply.code(401).send({ error: 'unauthorized' });
    }
  }
);


// ==========================
// ✅ HEALTH CHECK
// ==========================
app.get('/health', async () => ({
  ok: true,
}));

app.get('/health/ready', async (req, reply) => {
  try {
    await prisma.$runCommandRaw({ ping: 1 });
    return { ok: true, db: 'up' };
  } catch (err) {
    req.log.error({ err }, 'DB failed');
    return reply.code(503).send({ ok: false });
  }
});


// ==========================
// ✅ ROUTES
// ==========================
registerAuthRoutes(app);
registerSuperAdminRoutes(app);
registerJobFilterRoutes(app);
registerCvRoutes(app);
registerUploadRoutes(app);
registerJobRoutes(app);
registerBlogRoutes(app);
registerSuggestionRoutes(app);
registerFavoriteRoutes(app);
registerCommentRoutes(app);
registerUserProfileRoutes(app);
registerFileRoutes(app);
registerExamPrepRoutes(app);
registerSocialRoutes(app);
registerGroupRoutes(app);
registerMessageRoutes(app);
registerStatsRoutes(app);
registerQuestionBankRoutes(app);


// ==========================
// ✅ SHUTDOWN
// ==========================
app.addHook('onClose', async () => {
  await prisma.$disconnect();
});


// ==========================
// ✅ START SERVER
// ==========================
try {
  await prisma.$connect();
  await ensureUploadDir();
  await fixLegacyUserTimestamps();
  await ensureSuperAdmin();

  await app.listen({
    port: PORT,
    host: '0.0.0.0',
  });

  console.log(`🚀 Server running on http://localhost:${PORT}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
