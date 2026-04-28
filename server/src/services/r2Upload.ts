import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { randomUUID } from 'node:crypto';

const MIME_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'application/pdf': '.pdf',
  'application/zip': '.zip',
  'application/x-zip-compressed': '.zip',
};

function getPrefix(mime: string): string {
  if (mime.startsWith('image/')) return 'images';
  if (mime === 'application/pdf') return 'pdfs';
  if (mime.includes('zip')) return 'archives';
  return 'uploads';
}

function requireR2Env() {
  const endpoint = process.env.R2_ENDPOINT?.replace(/\/$/, '');
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim() || process.env.R2_ACCESS_KEY?.trim();
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim() || process.env.R2_SECRET_KEY?.trim();
  const bucket = process.env.R2_BUCKET?.trim();
  const publicBase = process.env.R2_PUBLIC_URL?.replace(/\/$/, '');

  const placeholder = /^REPLACE_/i.test(bucket || '') || /^REPLACE_/i.test(publicBase || '') || /xxxxx/i.test(publicBase || '');
  if (!endpoint || !accessKeyId || !secretAccessKey || !bucket || !publicBase || placeholder) {
    throw new Error('R2 not configured correctly. Bucket must be "chakrihub-storage"');
  }

  const client = new S3Client({
    region: 'auto',
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: process.env.R2_FORCE_PATH_STYLE === '1',
  });

  return { client, bucket, publicBase };
}

export async function uploadBase64FileToR2(base64OrDataUrl: string): Promise<string> {
  const { client, bucket, publicBase } = requireR2Env();
  const raw = base64OrDataUrl.trim();

  const dataUrlMatch = /^data:([^;]+);base64,(.+)$/i.exec(raw);
  const mime = dataUrlMatch?.[1]?.split(';')[0]?.trim().toLowerCase() || 'application/octet-stream';
  const b64 = dataUrlMatch ? dataUrlMatch[2] : raw;

  if (!MIME_EXT[mime]) {
    throw new Error(`Unsupported MIME type: ${mime}`);
  }

  let buffer: Buffer;
  try {
    buffer = Buffer.from(b64, 'base64');
  } catch {
    throw new Error('Invalid base64');
  }

  const maxSizeMB = parseInt(process.env.MAX_UPLOAD_SIZE_MB || '50', 10);
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (buffer.length < 32) throw new Error('File too small');
  if (buffer.length > maxSizeBytes) throw new Error(`File too large (max ${maxSizeMB} MB)`);

  const ext = MIME_EXT[mime];
  const prefix = getPrefix(mime);
  const key = `${prefix}/${randomUUID()}${ext}`;

  const cacheControl = mime.startsWith('image/') ? 'public, max-age=31536000, immutable' : 'public, max-age=86400';

  await client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ContentType: mime,
    CacheControl: cacheControl,
  }));

  return `${publicBase}/${key}`;
}

// পুরনো নামে অ্যালিয়াস – যাতে আপনার বিদ্যমান import কাজ করে
export const uploadBase64ImageToR2 = uploadBase64FileToR2;