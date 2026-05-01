import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyJwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import { prisma } from './db.js';

import { registerAuthRoutes } from './routes/auth.js';
import { registerUploadRoutes } from './routes/upload.js';

const PORT = Number(process.env.PORT) || 3006;

const app = Fastify({
  logger: true,
  trustProxy: true,
  bodyLimit: 20 * 1024 * 1024,
  genReqId: () => randomUUID(),
});

// ✅ ONLY ONE CORS CONFIG
await app.register(cors, {
  origin: 'https://chakrihub.tonusoft.com',
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
});

// rate limit
await app.register(rateLimit, {
  global: true,
  max: 1000,
  timeWindow: '1 minute',
});

// jwt
await app.register(fastifyJwt, {
  secret: process.env.JWT_SECRET || 'dev',
});

// health
app.get('/health', async () => {
  return { ok: true, service: 'chakrihub-api' };
});

// routes
registerAuthRoutes(app);
registerUploadRoutes(app);

app.addHook('onClose', async () => {
  await prisma.$disconnect();
});

try {
  await prisma.$connect();

  await app.listen({
    port: PORT,
    host: '0.0.0.0',
  });

  console.log(`🚀 API running on ${PORT}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
