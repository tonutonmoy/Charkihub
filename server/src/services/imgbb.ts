/**
 * ImageBB API: https://api.imgbb.com/
 * Upload base64 image; returns public HTTPS URL.
 */
export async function uploadBase64ToImgbb(base64OrDataUrl: string): Promise<string> {
  const key = process.env.IMGBB_API_KEY;
  if (!key) {
    throw new Error('IMGBB_API_KEY is not configured');
  }
  const b64 = base64OrDataUrl.replace(/^data:image\/\w+;base64,/, '').trim();
  const body = new URLSearchParams();
  body.set('key', key);
  body.set('image', b64);

  const res = await fetch('https://api.imgbb.com/1/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
    body: body.toString(),
  });

  const json = (await res.json()) as {
    success?: boolean;
    data?: { url?: string; display_url?: string };
    error?: { message?: string };
  };

  if (!json.success || !json.data?.url) {
    const msg = json.error?.message || res.statusText || 'ImageBB upload failed';
    throw new Error(msg);
  }
  return json.data.url;
}
