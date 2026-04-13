/**
 * Smoke test against a running API. Start server first: npm run dev
 * Optional: API_URL=http://127.0.0.1:4000 node scripts/test-api.mjs
 */
const BASE = (process.env.API_URL || 'http://127.0.0.1:4000').replace(/\/$/, '');

async function main() {
  const health = await fetch(`${BASE}/health`);
  if (!health.ok) throw new Error(`health ${health.status}`);
  console.log('health:', await health.json());

  const email = `apitest_${Date.now()}@example.com`;
  const reg = await fetch(`${BASE}/api/v1/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'secret12', name: 'API Test' }),
  });
  const regBody = await reg.json();
  if (!reg.ok) throw new Error(`register ${reg.status}: ${JSON.stringify(regBody)}`);
  const { token } = regBody;
  console.log('register: ok, user id', regBody.user?.id);

  const me = await fetch(`${BASE}/api/v1/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log('me:', await me.json());

  const cvPayload = {
    language: 'en',
    photoDataUrl: '',
    personalInfo: { fullName: 'Test User' },
    education: [],
    experience: [],
    skills: [],
    references: [],
    publications: [],
    training: [],
  };

  const put = await fetch(`${BASE}/api/v1/cv/1`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(cvPayload),
  });
  const putBody = await put.json();
  if (!put.ok) throw new Error(`put cv ${put.status}: ${JSON.stringify(putBody)}`);
  console.log('put cv:', putBody);

  const get = await fetch(`${BASE}/api/v1/cv/1`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const getBody = await get.json();
  if (!get.ok) throw new Error(`get cv ${get.status}: ${JSON.stringify(getBody)}`);
  console.log('get cv data keys:', Object.keys(getBody.data || {}));

  console.log('All API smoke checks passed.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
