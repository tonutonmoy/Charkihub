import type { FastifyInstance, FastifyRequest } from 'fastify';
import { createReadStream, existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const UPLOAD_ROOT = path.join(process.cwd(), 'uploads');

export async function ensureUploadDir(): Promise<void> {
  if (!existsSync(UPLOAD_ROOT)) {
    await mkdir(UPLOAD_ROOT, { recursive: true });
  }
}

export function uploadDir(): string {
  return UPLOAD_ROOT;
}

/** Public URL for an uploaded file (uses PUBLIC_API_BASE when set). */
export function publicFileUrl(req: FastifyRequest, filename: string): string {
  const base = process.env.PUBLIC_API_BASE?.replace(/\/$/, '');
  if (base) return `${base}/api/v1/files/${filename}`;
  const host = req.headers.host || 'localhost:4000';
  const proto = (req.headers['x-forwarded-proto'] as string) || 'http';
  return `${proto}://${host}/api/v1/files/${filename}`;
}

export function registerFileRoutes(app: FastifyInstance) {
  app.get<{ Params: { name: string } }>(`/api/v1/files/:name`, async (req, reply) => {
    const safe = path.basename(req.params.name);
    if (!safe || safe !== req.params.name) {
      return reply.code(400).send({ error: 'invalid name' });
    }
    const fp = path.join(UPLOAD_ROOT, safe);
    if (!existsSync(fp)) {
      return reply.code(404).send({ error: 'not found' });
    }
    const ext = path.extname(safe).toLowerCase();
    const type =
      ext === '.pdf'
        ? 'application/pdf'
        : ext === '.png'
          ? 'image/png'
          : ext === '.jpg' || ext === '.jpeg'
            ? 'image/jpeg'
            : 'application/octet-stream';
    reply.header('Content-Type', type);
    reply.header('Cache-Control', 'public, max-age=31536000');
    return reply.send(createReadStream(fp));
  });
}

/** Save buffer to uploads, return filename */
export async function saveUploadedFile(buf: Buffer, originalName: string): Promise<string> {
  await ensureUploadDir();
  const ext = path.extname(originalName).toLowerCase() || '.bin';
  const allowed = ['.pdf', '.png', '.jpg', '.jpeg', '.webp', '.gif'];
  const useExt = allowed.includes(ext) ? ext : '.bin';
  const name = `${randomUUID()}${useExt}`;
  await writeFile(path.join(UPLOAD_ROOT, name), buf);
  return name;
}
