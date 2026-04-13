import 'dotenv/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

const endpoint = process.env.R2_ENDPOINT?.replace(/\/$/, '');
const accessKeyId =
  process.env.R2_ACCESS_KEY_ID?.trim() || process.env.R2_ACCESS_KEY?.trim();
const secretAccessKey =
  process.env.R2_SECRET_ACCESS_KEY?.trim() || process.env.R2_SECRET_KEY?.trim();
const Bucket = process.env.R2_BUCKET?.trim();

if (!endpoint || !accessKeyId || !secretAccessKey || !Bucket) {
  console.error('Missing R2_ENDPOINT / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY / R2_BUCKET in .env');
  process.exit(1);
}

const client = new S3Client({
  region: 'auto',
  endpoint,
  credentials: { accessKeyId, secretAccessKey },
  forcePathStyle: process.env.R2_FORCE_PATH_STYLE === '1',
});

const Key = `probe/${Date.now()}.txt`;

try {
  await client.send(
    new PutObjectCommand({
      Bucket,
      Key,
      Body: Buffer.from('ok'),
      ContentType: 'text/plain',
    })
  );
  console.log('R2_PUT_OK', Bucket, Key);
  await client.send(new DeleteObjectCommand({ Bucket, Key }));
  console.log('R2_DELETE_OK');
} catch (e) {
  console.error('R2_FAIL', e?.name || e?.Code, e?.message, e?.$metadata?.httpStatusCode);
  process.exit(1);
}
