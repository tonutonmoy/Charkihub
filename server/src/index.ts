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

const PORT = Number(process.env.PORT) || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-change-in-production';

const TRUST_PROXY =
  process.env.TRUST_PROXY === '1' ||
  process.env.NODE_ENV === 'production';

// ✅ whitelist your domains
const allowedOrigins = [
 "https://charkihub.vercel.app",
 "https://www.charkihub.vercel.app",
//  "http://localhost:3000"

];

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

const app = Fastify({
  logger: true,
  trustProxy: TRUST_PROXY,
  bodyLimit: 12 * 1024 * 1024,
  requestIdHeader: 'x-request-id',
  genReqId: () => randomUUID(),
});


// ✅🔥 FIXED CORS CONFIG
await app.register(cors, {
  origin: (origin, cb) => {
    // allow server-to-server / curl
    if (!origin) return cb(null, true);

    if (allowedOrigins.includes(origin)) {
      return cb(null, true);
    }

    return cb(new Error('Not allowed by CORS'), false);
  },

  credentials: true,

  methods: [
    'GET',
    'POST',
    'PUT',
    'PATCH',   // ✅ IMPORTANT
    'DELETE',
    'OPTIONS',
  ],

  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
  ],

  exposedHeaders: ['set-cookie'],

  preflightContinue: false,
  optionsSuccessStatus: 204,
});


// ✅ Rate limit
await app.register(rateLimit, {
  global: true,
  max: 800,
  timeWindow: '1 minute',
});


// ✅ JWT
await app.register(fastifyJwt, {
  secret: JWT_SECRET,
  sign: { expiresIn: '14d' },
});


// ✅ Auth decorator
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


// ✅ Health
app.get('/health', async () => ({
  ok: true,
  service: 'chakrebd-api',
}));

app.get('/health/ready', async (req, reply) => {
  try {
    await prisma.$runCommandRaw({ ping: 1 });
    return { ok: true, db: 'up' };
  } catch (err) {
    req.log.error({ err }, 'DB check failed');
    return reply.code(503).send({ ok: false, db: 'down' });
  }
});


// ✅ Routes
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


// ✅ Shutdown
app.addHook('onClose', async () => {
  await prisma.$disconnect();
});


// ✅ Start server
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