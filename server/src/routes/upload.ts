import type { FastifyInstance } from 'fastify';
import { uploadBase64ToImgbb } from '../services/imgbb.js';
import { publicFileUrl, saveUploadedFile } from './files.js';

const P = '/api/v1';

const MAX_FILE_BYTES = 8 * 1024 * 1024;

export function registerUploadRoutes(app: FastifyInstance) {
  app.post<{
    Body: { image?: string };
  }>(
    `${P}/upload/image`,
    { preHandler: [app.authenticate] },
    async (req, reply) => {
      const { image } = req.body || {};
      if (!image || typeof image !== 'string') {
        return reply.code(400).send({ error: 'image (base64 or data URL) is required' });
      }
      try {
        const url = await uploadBase64ToImgbb(image);
        return { url };
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'upload failed';
        return reply.code(502).send({ error: msg });
      }
    }
  );

  /** PDF or binary file: base64 (data URL ok). Stored on server; URL returned (ImgBB is image-only). */
  app.post<{
    Body: { file?: string; filename?: string };
  }>(`${P}/upload/file`, { preHandler: [app.authenticate] }, async (req, reply) => {
    const raw = req.body?.file;
    if (!raw || typeof raw !== 'string') {
      return reply.code(400).send({ error: 'file (base64 or data URL) is required' });
    }
    const b64 = raw.replace(/^data:[^;]+;base64,/, '').trim();
    let buf: Buffer;
    try {
      buf = Buffer.from(b64, 'base64');
    } catch {
      return reply.code(400).send({ error: 'invalid base64' });
    }
    if (buf.length < 16) return reply.code(400).send({ error: 'file too small' });
    if (buf.length > MAX_FILE_BYTES) {
      return reply.code(400).send({ error: 'file too large (max 8MB)' });
    }
    const name = String(req.body?.filename || 'document.pdf').slice(0, 200);
    const saved = await saveUploadedFile(buf, name);
    return { url: publicFileUrl(req, saved) };
  });
}
