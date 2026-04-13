import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { randomUUID } from 'node:crypto';

const MIME_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

function requireR2Env(): {
  client: S3Client;
  bucket: string;
  publicBase: string;
} {
  const endpoint = process.env.R2_ENDPOINT?.replace(/\/$/, '');
  const accessKeyId =
    process.env.R2_ACCESS_KEY_ID?.trim() || process.env.R2_ACCESS_KEY?.trim();
  const secretAccessKey =
    process.env.R2_SECRET_ACCESS_KEY?.trim() || process.env.R2_SECRET_KEY?.trim();
  const bucket = process.env.R2_BUCKET?.trim();
  const publicBase = process.env.R2_PUBLIC_URL?.replace(/\/$/, '');

  const placeholder =
    /^REPLACE_/i.test(bucket || '') ||
    /^REPLACE_/i.test(publicBase || '') ||
    /xxxxx/i.test(publicBase || '');
  if (!endpoint || !accessKeyId || !secretAccessKey || !bucket || !publicBase || placeholder) {
    throw new Error(
      'R2 is not configured. Set R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET (real bucket name), R2_PUBLIC_URL (real public base URL, no trailing slash)'
    );
  }

  const client = new S3Client({
    region: 'auto',
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: process.env.R2_FORCE_PATH_STYLE === '1',
  });

  return { client, bucket, publicBase };
}

/**
 * Upload a base64 image to Cloudflare R2 (S3 API). Returns a public HTTPS URL.
 * R2_PUBLIC_URL must match how the bucket is exposed (custom domain or *.r2.dev).
 */
export async function uploadBase64ImageToR2(base64OrDataUrl: string): Promise<string> {
  const { client, bucket, publicBase } = requireR2Env();

  const raw = base64OrDataUrl.trim();
  const dataUrl = /^data:(image\/[^;]+);base64,(.+)$/i.exec(raw);
  const mime = (dataUrl?.[1]?.split(';')[0]?.trim().toLowerCase() || 'image/jpeg') as string;
  const b64 = dataUrl ? dataUrl[2] : raw.replace(/^data:image\/\w+;base64,/, '');

  let buf: Buffer;
  try {
    buf = Buffer.from(b64, 'base64');
  } catch {
    throw new Error('invalid base64 image');
  }
  if (buf.length < 32) throw new Error('image too small');
  if (buf.length > 8 * 1024 * 1024) throw new Error('image too large (max 8MB)');

  const ext = MIME_EXT[mime] || '.jpg';
  const key = `images/${randomUUID()}${ext}`;

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buf,
      ContentType: mime,
      CacheControl: 'public, max-age=31536000',
    })
  );

  return `${publicBase}/${key}`;
}
