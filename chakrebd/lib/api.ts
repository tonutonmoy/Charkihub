const TOKEN_KEY = 'chakrebd_token';

/** Matches server: superadmin | admin | user */
export type ApiRole = 'superadmin' | 'admin' | 'user';

export type ApiUser = {
  /** MongoDB ObjectId string from API */
  id: string;
  email: string;
  name: string;
  role: ApiRole | string;
  countryCode?: string;
  localArea?: string | null;
  interests?: string[];
  locale?: string;
  cvFormat?: string | null;
  createdAt?: string;
};

/**
 * API base URL for `fetch`.
 * - If `NEXT_PUBLIC_API_URL` is set → use it (direct to API; ensure CORS allows the site origin).
 * - If unset in the browser → `''` (same-origin) so Next.js `rewrites` can proxy `/api/v1/*` → Fastify (no CORS issues).
 * - During SSR/Node without `window` → `API_INTERNAL_URL` or `API_PROXY_TARGET` or localhost:4000.
 */
export function getApiBase(): string {
  const explicit = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, '');
  if (typeof window !== 'undefined') return '';
  const internal =
    process.env.API_INTERNAL_URL?.trim() ||
    process.env.API_PROXY_TARGET?.trim() ||
    'http://127.0.0.1:4000';
  return internal.replace(/\/$/, '');
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
  if (typeof window === 'undefined') return;
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

type ErrBody = { error?: string };

async function parseJson(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return {};
  }
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit & { auth?: boolean } = {}
): Promise<{ ok: true; data: T } | { ok: false; status: number; error: string }> {
  const { auth = true, ...rest } = init;
  const headers = new Headers(rest.headers);
  if (!headers.has('Content-Type') && rest.body && typeof rest.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }
  if (auth) {
    const t = getToken();
    if (t) headers.set('Authorization', `Bearer ${t}`);
  }
  const res = await fetch(`${getApiBase()}${path}`, { ...rest, headers });
  const body = (await parseJson(res)) as T & ErrBody;
  if (!res.ok) {
    const err = typeof body === 'object' && body && 'error' in body ? String((body as ErrBody).error) : res.statusText;
    return { ok: false, status: res.status, error: err || 'Request failed' };
  }
  return { ok: true, data: body as T };
}

export async function registerUser(
  name: string,
  email: string,
  password: string,
  profile?: { countryCode?: string; localArea?: string; interests?: string[] }
): Promise<{ ok: true; token: string; user: ApiUser } | { ok: false; error: string }> {
  const r = await apiFetch<{ token: string; user: ApiUser }>('/api/v1/register', {
    method: 'POST',
    body: JSON.stringify({
      name,
      email,
      password,
      ...profile,
    }),
    auth: false,
  });
  if (!r.ok) return { ok: false, error: r.error };
  return { ok: true, token: r.data.token, user: r.data.user };
}

export async function loginUser(
  email: string,
  password: string
): Promise<{ ok: true; token: string; user: ApiUser } | { ok: false; error: string }> {
  const r = await apiFetch<{ token: string; user: ApiUser }>('/api/v1/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
    auth: false,
  });
  if (!r.ok) return { ok: false, error: r.error };
  return { ok: true, token: r.data.token, user: r.data.user };
}

export async function fetchMe(): Promise<{ ok: true; user: ApiUser } | { ok: false }> {
  const r = await apiFetch<{ user: ApiUser }>('/api/v1/me');
  if (!r.ok) return { ok: false };
  return { ok: true, user: r.data.user };
}

export async function getCvDraft(
  templateId: string
): Promise<{ ok: true; data: unknown } | { ok: false; notFound: boolean; error?: string }> {
  const r = await apiFetch<{ data: unknown }>(`/api/v1/cv/${encodeURIComponent(templateId)}`);
  if (!r.ok) {
    if (r.status === 404) return { ok: false, notFound: true };
    return { ok: false, notFound: false, error: r.error };
  }
  const payload = r.data as { data?: unknown };
  return { ok: true, data: payload.data };
}

export async function putCvDraft(
  templateId: string,
  data: unknown
): Promise<{ ok: true } | { ok: false; error: string }> {
  const r = await apiFetch<{ ok?: boolean }>(`/api/v1/cv/${encodeURIComponent(templateId)}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  if (!r.ok) return { ok: false, error: r.error };
  return { ok: true };
}

export async function uploadImageBase64(
  image: string
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const r = await apiFetch<{ url: string }>('/api/v1/upload/image', {
    method: 'POST',
    body: JSON.stringify({ image }),
  });
  if (!r.ok) return { ok: false, error: r.error };
  return { ok: true, url: r.data.url };
}

// --- Jobs & content ---

export type JobMainCategory = 'government' | 'private' | 'local';

export type ApiJobListItem = {
  id: string;
  mainCategory: string;
  subCategory: string;
  countryCode: string;
  localArea: string | null;
  title: string;
  summary: string;
  organization: string;
  applyUrl: string | null;
  phone: string | null;
  startAt: string;
  endAt: string;
  pdfUrl: string | null;
  alertEnabled: boolean;
  alertMessage: string | null;
  status: string;
  likeCount: number;
  createdAt: string;
  updatedAt: string;
  liked?: boolean;
};

export type ApiJobDetail = ApiJobListItem & {
  description: string | null;
  liked?: boolean;
  favorited?: boolean;
};

function qs(params: Record<string, string | number | undefined>): string {
  const e = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === '') continue;
    e.set(k, String(v));
  }
  const s = e.toString();
  return s ? `?${s}` : '';
}

export async function listJobs(params: {
  country: string;
  mainCategory?: JobMainCategory;
  subCategory?: string;
  localArea?: string;
  search?: string;
  interestMatch?: boolean;
  matchUserLocation?: boolean;
  page?: number;
  limit?: number;
}): Promise<
  { ok: true; jobs: ApiJobListItem[]; page: number; limit: number; total: number } | { ok: false; error: string }
> {
  const r = await apiFetch<{
    jobs: ApiJobListItem[];
    page: number;
    limit: number;
    total: number;
  }>(
    `/api/v1/jobs${qs({
      country: params.country,
      mainCategory: params.mainCategory,
      subCategory: params.subCategory,
      localArea: params.localArea,
      search: params.search,
      interestMatch: params.interestMatch ? 1 : undefined,
      matchUserLocation: params.matchUserLocation ? 1 : undefined,
      page: params.page,
      limit: params.limit,
    })}`,
    /** Send JWT when present so `liked` can be filled; works without login. */
    { auth: true }
  );
  if (!r.ok) return { ok: false, error: r.error };
  const d = r.data;
  return {
    ok: true,
    jobs: d.jobs ?? [],
    page: d.page ?? 1,
    limit: d.limit ?? 20,
    total: d.total ?? 0,
  };
}

export async function fetchJobFilterOptions(params: {
  country: string;
  mainCategory?: JobMainCategory;
}): Promise<
  { ok: true; subCategories: string[]; localAreas: string[] } | { ok: false; error: string }
> {
  const r = await apiFetch<{ subCategories: string[]; localAreas: string[] }>(
    `/api/v1/jobs/filter-options${qs({
      country: params.country,
      mainCategory: params.mainCategory,
    })}`,
    { auth: false }
  );
  if (!r.ok) return { ok: false, error: r.error };
  return { ok: true, subCategories: r.data.subCategories, localAreas: r.data.localAreas };
}

export type PublicJobFiltersPayload = {
  countries: { value: string; label: string }[];
  mainCategories: { value: string; label: string }[];
  citiesByCountry: Record<string, { value: string; label: string }[]>;
  subCategoriesByCountry: Record<string, Record<string, { value: string; label: string }[]>>;
};

export async function fetchPublicJobFilters(country?: string): Promise<
  { ok: true; data: PublicJobFiltersPayload } | { ok: false; error: string }
> {
  const r = await apiFetch<PublicJobFiltersPayload>(`/api/v1/job-filters${qs({ country: country })}`, {
    auth: false,
  });
  if (!r.ok) return { ok: false, error: r.error };
  return { ok: true, data: r.data };
}

export type ApiJobFilterOption = {
  id: string;
  kind: string;
  countryCode: string;
  mainCategory: string;
  value: string;
  label: string;
  sortOrder: number;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export async function superadminListJobFilters(params?: {
  kind?: string;
  countryCode?: string;
}): Promise<{ ok: true; items: ApiJobFilterOption[] } | { ok: false; error: string }> {
  const r = await apiFetch<{ items: ApiJobFilterOption[] }>(
    `/api/v1/superadmin/job-filters${qs({
      kind: params?.kind,
      countryCode: params?.countryCode,
    })}`
  );
  if (!r.ok) return { ok: false, error: r.error };
  return { ok: true, items: r.data.items };
}

export async function superadminCreateJobFilter(body: {
  kind: string;
  countryCode?: string;
  mainCategory?: string;
  value: string;
  label: string;
  sortOrder?: number;
  active?: boolean;
}): Promise<{ ok: true; item: ApiJobFilterOption } | { ok: false; error: string }> {
  const r = await apiFetch<{ item: ApiJobFilterOption }>(`/api/v1/superadmin/job-filters`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!r.ok) return { ok: false, error: r.error };
  return { ok: true, item: r.data.item };
}

export async function superadminUpdateJobFilter(
  id: string,
  body: Partial<{
    label: string;
    sortOrder: number;
    active: boolean;
    value: string;
    countryCode: string;
    mainCategory: string;
  }>
): Promise<{ ok: true; item: ApiJobFilterOption } | { ok: false; error: string }> {
  const r = await apiFetch<{ item: ApiJobFilterOption }>(`/api/v1/superadmin/job-filters/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
  if (!r.ok) return { ok: false, error: r.error };
  return { ok: true, item: r.data.item };
}

export async function superadminDeleteJobFilter(
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const r = await apiFetch<{ ok: boolean }>(`/api/v1/superadmin/job-filters/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  if (!r.ok) return { ok: false, error: r.error };
  return { ok: true };
}

export async function topRatedJobs(params: {
  country: string;
  mainCategory?: JobMainCategory;
  limit?: number;
}): Promise<{ ok: true; jobs: ApiJobListItem[] } | { ok: false; error: string }> {
  const r = await apiFetch<{ jobs: ApiJobListItem[] }>(
    `/api/v1/jobs/top-rated${qs({
      country: params.country,
      mainCategory: params.mainCategory,
      limit: params.limit,
    })}`,
    { auth: true }
  );
  if (!r.ok) return { ok: false, error: r.error };
  return { ok: true, jobs: r.data.jobs ?? [] };
}

export async function getJob(id: string): Promise<{ ok: true; job: ApiJobDetail } | { ok: false; error: string }> {
  const r = await apiFetch<{ job: ApiJobDetail }>(`/api/v1/jobs/${encodeURIComponent(id)}`, { auth: true });
  if (!r.ok) return { ok: false, error: r.error };
  return { ok: true, job: r.data.job };
}

export async function likeJob(id: string): Promise<{ ok: true; likeCount: number } | { ok: false; error: string }> {
  const r = await apiFetch<{ likeCount: number }>(`/api/v1/jobs/${encodeURIComponent(id)}/like`, {
    method: 'POST',
  });
  if (!r.ok) return { ok: false, error: r.error };
  return { ok: true, likeCount: r.data.likeCount };
}

export async function unlikeJob(id: string): Promise<{ ok: true; likeCount: number } | { ok: false; error: string }> {
  const r = await apiFetch<{ likeCount: number }>(`/api/v1/jobs/${encodeURIComponent(id)}/like`, {
    method: 'DELETE',
  });
  if (!r.ok) return { ok: false, error: r.error };
  return { ok: true, likeCount: r.data.likeCount };
}

export type ApiAdminJob = ApiJobListItem & {
  description: string | null;
};

export async function adminListJobs(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'draft' | 'published';
}): Promise<
  { ok: true; jobs: ApiAdminJob[]; page: number; limit: number; total: number } | { ok: false; error: string }
> {
  const r = await apiFetch<{
    jobs: ApiAdminJob[];
    page: number;
    limit: number;
    total: number;
  }>(`/api/v1/admin/jobs${qs({ page: params?.page, limit: params?.limit, search: params?.search, status: params?.status })}`);
  if (!r.ok) return { ok: false, error: r.error };
  return { ok: true, ...r.data };
}

export async function adminCreateJob(
  body: Record<string, unknown>
): Promise<{ ok: true; job: ApiAdminJob } | { ok: false; error: string }> {
  const r = await apiFetch<{ job: ApiAdminJob }>('/api/v1/admin/jobs', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!r.ok) return { ok: false, error: r.error };
  return { ok: true, job: r.data.job };
}

export async function adminUpdateJob(
  id: string,
  body: Record<string, unknown>
): Promise<{ ok: true; job: ApiAdminJob } | { ok: false; error: string }> {
  const r = await apiFetch<{ job: ApiAdminJob }>(`/api/v1/admin/jobs/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
  if (!r.ok) return { ok: false, error: r.error };
  return { ok: true, job: r.data.job };
}

export async function adminDeleteJob(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const r = await apiFetch<{ ok: boolean }>(`/api/v1/admin/jobs/${encodeURIComponent(id)}`, { method: 'DELETE' });
  if (!r.ok) return { ok: false, error: r.error };
  return { ok: true };
}

// --- Blog (public) ---

export type ApiBlogListItem = {
  id: string;
  title: string;
  slug: string | null;
  excerpt: string;
  countryCode: string;
  category: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
  favorited?: boolean;
};

export type ApiBlogDetail = ApiBlogListItem & {
  content: string;
  favorited?: boolean;
};

export async function listBlogPosts(params: {
  country: string;
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<
  { ok: true; posts: ApiBlogListItem[]; page: number; limit: number; total: number } | { ok: false; error: string }
> {
  const r = await apiFetch<{
    posts: ApiBlogListItem[];
    page: number;
    limit: number;
    total: number;
  }>(
    `/api/v1/blog${qs({
      country: params.country,
      category: params.category,
      search: params.search,
      page: params.page,
      limit: params.limit,
    })}`,
    { auth: true }
  );
  if (!r.ok) return { ok: false, error: r.error };
  return { ok: true, ...r.data };
}

export async function getBlogPost(
  id: string
): Promise<{ ok: true; post: ApiBlogDetail } | { ok: false; error: string }> {
  const r = await apiFetch<{ post: ApiBlogDetail }>(`/api/v1/blog/${encodeURIComponent(id)}`, { auth: true });
  if (!r.ok) return { ok: false, error: r.error };
  return { ok: true, post: r.data.post };
}

// --- Suggestions (public) ---

export type ApiSuggestionListItem = {
  id: string;
  title: string;
  summary: string;
  category: string;
  countryCode: string;
  content: string | null;
  externalUrl: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  /** Present on single-item GET when authenticated */
  favorited?: boolean;
};

export async function listSuggestionsApi(params: {
  country: string;
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<
  | { ok: true; suggestions: ApiSuggestionListItem[]; page: number; limit: number; total: number }
  | { ok: false; error: string }
> {
  const r = await apiFetch<{
    suggestions: ApiSuggestionListItem[];
    page: number;
    limit: number;
    total: number;
  }>(
    `/api/v1/suggestions${qs({
      country: params.country,
      category: params.category,
      search: params.search,
      page: params.page,
      limit: params.limit,
    })}`,
    { auth: true }
  );
  if (!r.ok) return { ok: false, error: r.error };
  return { ok: true, ...r.data };
}

export async function getSuggestion(
  id: string
): Promise<{ ok: true; suggestion: ApiSuggestionListItem } | { ok: false; error: string }> {
  const r = await apiFetch<{ suggestion: ApiSuggestionListItem }>(
    `/api/v1/suggestions/${encodeURIComponent(id)}`,
    { auth: true }
  );
  if (!r.ok) return { ok: false, error: r.error };
  return { ok: true, suggestion: r.data.suggestion };
}

export async function updateProfile(body: {
  name?: string;
  countryCode?: string;
  localArea?: string | null;
  interests?: string[];
  locale?: string;
  cvFormat?: string | null;
}): Promise<{ ok: true; user: ApiUser } | { ok: false; error: string }> {
  const r = await apiFetch<{ user: ApiUser }>('/api/v1/me/profile', {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
  if (!r.ok) return { ok: false, error: r.error };
  return { ok: true, user: r.data.user };
}

export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const r = await apiFetch<{ ok: boolean }>('/api/v1/me/password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  if (!r.ok) return { ok: false, error: r.error };
  return { ok: true };
}

export async function addFavorite(
  targetType: 'job' | 'blog' | 'suggestion',
  targetId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const r = await apiFetch<{ ok: boolean }>('/api/v1/favorites', {
    method: 'POST',
    body: JSON.stringify({ targetType, targetId }),
  });
  if (!r.ok) return { ok: false, error: r.error };
  return { ok: true };
}

export async function removeFavorite(
  targetType: 'job' | 'blog' | 'suggestion',
  targetId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const r = await apiFetch<{ ok: boolean }>(
    `/api/v1/favorites${qs({ targetType, targetId })}`,
    { method: 'DELETE' }
  );
  if (!r.ok) return { ok: false, error: r.error };
  return { ok: true };
}

export type FavoriteResolved =
  | { type: 'job'; id: string; item: ApiAdminJob }
  | { type: 'blog'; id: string; item: Record<string, unknown> }
  | { type: 'suggestion'; id: string; item: Record<string, unknown> };

export async function listMyFavorites(): Promise<
  { ok: true; favorites: FavoriteResolved[] } | { ok: false; error: string }
> {
  const r = await apiFetch<{ favorites: FavoriteResolved[] }>('/api/v1/me/favorites');
  if (!r.ok) return { ok: false, error: r.error };
  return { ok: true, favorites: r.data.favorites };
}

export type ApiCommentNode = {
  id: string;
  body: string;
  createdAt: string;
  parentId: string | null;
  user: { id: string; name: string };
  reactions?: { emoji: string; count: number }[];
  myReaction: string | null;
  replies: ApiCommentNode[];
};

export async function listComments(
  targetType: 'job' | 'blog' | 'feed',
  targetId: string
): Promise<{ ok: true; comments: ApiCommentNode[] } | { ok: false; error: string }> {
  const r = await apiFetch<{ comments: ApiCommentNode[] }>(
    `/api/v1/comments/${targetType}/${encodeURIComponent(targetId)}`,
    { auth: false }
  );
  if (!r.ok) return { ok: false, error: r.error };
  return { ok: true, comments: r.data.comments };
}

export async function postComment(
  targetType: 'job' | 'blog' | 'feed',
  targetId: string,
  body: string,
  parentId?: string | null
): Promise<{ ok: true; comment: ApiCommentNode } | { ok: false; error: string }> {
  const r = await apiFetch<{ comment: ApiCommentNode }>(
    `/api/v1/comments/${targetType}/${encodeURIComponent(targetId)}`,
    {
      method: 'POST',
      body: JSON.stringify({ body, parentId: parentId ?? undefined }),
    }
  );
  if (!r.ok) return { ok: false, error: r.error };
  return { ok: true, comment: r.data.comment };
}

export async function setReaction(params: {
  targetType: 'comment' | 'feed_post' | 'job';
  targetId: string;
  emoji: string;
}): Promise<
  | {
      ok: true;
      reactions: { emoji: string; count: number }[];
      myReaction: string | null;
      removed?: boolean;
    }
  | { ok: false; error: string }
> {
  const r = await apiFetch<{
    reactions: { emoji: string; count: number }[];
    myReaction: string | null;
    removed?: boolean;
  }>('/api/v1/reactions', {
    method: 'POST',
    body: JSON.stringify(params),
  });
  if (!r.ok) return { ok: false, error: r.error };
  return { ok: true, ...r.data };
}

export async function uploadFileBase64(
  file: string,
  filename?: string
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const r = await apiFetch<{ url: string }>('/api/v1/upload/file', {
    method: 'POST',
    body: JSON.stringify({ file, filename }),
  });
  if (!r.ok) return { ok: false, error: r.error };
  return { ok: true, url: r.data.url };
}

// --- Exam prep (public) ---

export type ApiExamPrepCategory = { id: string; label: string; slug: string; countryCode: string };

export async function fetchExamPrepCategories(country: string): Promise<
  { ok: true; categories: ApiExamPrepCategory[] } | { ok: false; error: string }
> {
  const r = await apiFetch<{ categories: ApiExamPrepCategory[] }>(
    `/api/v1/exam-prep/categories${qs({ country })}`,
    { auth: false }
  );
  if (!r.ok) return { ok: false, error: r.error };
  return { ok: true, categories: r.data.categories };
}

export type ApiExamPrepCourse = {
  id: string;
  title: string;
  description: string | null;
  lessons: number;
  duration: string;
  rating: number;
  price: string;
  createdAt: string;
  category: { id: string; label: string; slug: string };
};

export async function fetchExamPrepCourses(params: {
  country: string;
  categoryId?: string;
  search?: string;
}): Promise<{ ok: true; courses: ApiExamPrepCourse[] } | { ok: false; error: string }> {
  const r = await apiFetch<{ courses: ApiExamPrepCourse[] }>(
    `/api/v1/exam-prep/courses${qs({
      country: params.country,
      categoryId: params.categoryId,
      search: params.search,
    })}`,
    { auth: false }
  );
  if (!r.ok) return { ok: false, error: r.error };
  return { ok: true, courses: r.data.courses };
}

export async function fetchExamPrepCourse(
  id: string
): Promise<{ ok: true; course: ApiExamPrepCourse & { category: { id: string; label: string; slug: string } } } | { ok: false; error: string }> {
  const r = await apiFetch<{
    course: ApiExamPrepCourse & { category: { id: string; label: string; slug: string } };
  }>(`/api/v1/exam-prep/courses/${encodeURIComponent(id)}`, { auth: false });
  if (!r.ok) return { ok: false, error: r.error };
  return { ok: true, course: r.data.course };
}

// --- Social feed ---

export type ApiFeedPost = {
  id: string;
  body: string;
  bodyHtml?: string | null;
  viewCount: number;
  shareCount: number;
  createdAt: string;
  user: { id: string; name: string };
  group?: { id: string; name: string } | null;
  images: { url: string; sortOrder: number }[];
  /** Present on normal API responses; treat as [] if missing (older payloads / proxies). */
  reactions?: { emoji: string; count: number }[];
  myReaction: string | null;
};

export async function fetchFeed(params?: {
  page?: number;
  groupId?: string;
}): Promise<
  { ok: true; posts: ApiFeedPost[]; page: number; limit: number; total: number } | { ok: false; error: string }
> {
  const r = await apiFetch<{ posts: ApiFeedPost[]; page: number; limit: number; total: number }>(
    `/api/v1/feed${qs({
      page: params?.page,
      groupId: params?.groupId,
    })}`,
    { auth: true }
  );
  if (!r.ok) return { ok: false, error: r.error };
  return { ok: true, ...r.data };
}

export async function createFeedPost(body: {
  body?: string;
  bodyHtml?: string | null;
  imageUrls?: string[];
  groupId?: string | null;
}): Promise<{ ok: true; post: ApiFeedPost } | { ok: false; error: string }> {
  const r = await apiFetch<{ post: ApiFeedPost }>('/api/v1/feed/posts', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!r.ok) return { ok: false, error: r.error };
  return { ok: true, post: r.data.post };
}

export async function getFeedPost(id: string): Promise<{ ok: true; post: ApiFeedPost } | { ok: false; error: string }> {
  const r = await apiFetch<{ post: ApiFeedPost }>(`/api/v1/feed/posts/${encodeURIComponent(id)}`, { auth: false });
  if (!r.ok) return { ok: false, error: r.error };
  return { ok: true, post: r.data.post };
}

export async function shareFeedPost(id: string): Promise<{ ok: true; shareCount: number } | { ok: false; error: string }> {
  const r = await apiFetch<{ shareCount: number }>(`/api/v1/feed/posts/${encodeURIComponent(id)}/share`, {
    method: 'POST',
    auth: false,
  });
  if (!r.ok) return { ok: false, error: r.error };
  return { ok: true, shareCount: r.data.shareCount };
}

export async function searchUsers(q: string): Promise<
  { ok: true; users: { id: string; name: string; email: string; countryCode: string }[] } | { ok: false; error: string }
> {
  const r = await apiFetch<{ users: { id: string; name: string; email: string; countryCode: string }[] }>(
    `/api/v1/social/users/search${qs({ q, limit: 15 })}`
  );
  if (!r.ok) return { ok: false, error: r.error };
  return { ok: true, users: r.data.users };
}

export async function followUser(userId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const r = await apiFetch<{ ok: boolean }>(`/api/v1/social/follow/${encodeURIComponent(userId)}`, { method: 'POST' });
  if (!r.ok) return { ok: false, error: r.error };
  return { ok: true };
}

export async function unfollowUser(userId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const r = await apiFetch<{ ok: boolean }>(`/api/v1/social/follow/${encodeURIComponent(userId)}`, {
    method: 'DELETE',
  });
  if (!r.ok) return { ok: false, error: r.error };
  return { ok: true };
}

export async function requestConnection(toUserId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const r = await apiFetch<{ ok: boolean }>('/api/v1/social/connections/request', {
    method: 'POST',
    body: JSON.stringify({ toUserId }),
  });
  if (!r.ok) return { ok: false, error: r.error };
  return { ok: true };
}

export async function respondConnection(
  id: string,
  accept: boolean
): Promise<{ ok: true } | { ok: false; error: string }> {
  const r = await apiFetch<{ ok: boolean }>(`/api/v1/social/connections/${encodeURIComponent(id)}/respond`, {
    method: 'POST',
    body: JSON.stringify({ accept }),
  });
  if (!r.ok) return { ok: false, error: r.error };
  return { ok: true };
}

export async function listIncomingConnections(): Promise<
  | { ok: true; requests: { id: string; fromUser: { id: string; name: string; email: string }; createdAt: string }[] }
  | { ok: false; error: string }
> {
  const r = await apiFetch<{
    requests: { id: string; fromUser: { id: string; name: string; email: string }; createdAt: string }[];
  }>('/api/v1/social/connections/incoming');
  if (!r.ok) return { ok: false, error: r.error };
  return { ok: true, requests: r.data.requests };
}

/** Accepted connections (my network) */
export async function listConnections(): Promise<
  { ok: true; connections: { id: string; name: string; email: string }[] } | { ok: false; error: string }
> {
  const r = await apiFetch<{ connections: { id: string; name: string; email: string }[] }>(
    '/api/v1/social/connections'
  );
  if (!r.ok) return { ok: false, error: r.error };
  return { ok: true, connections: r.data.connections };
}

export async function listGroups(params?: { search?: string; page?: number }): Promise<
  | {
      ok: true;
      groups: {
        id: string;
        name: string;
        description: string | null;
        coverUrl: string | null;
        isPublic: boolean;
        memberCount: number;
        postCount: number;
        createdBy: { id: string; name: string };
      }[];
      total: number;
    }
  | { ok: false; error: string }
> {
  const r = await apiFetch<{
    groups: {
      id: string;
      name: string;
      description: string | null;
      coverUrl: string | null;
      isPublic: boolean;
      memberCount: number;
      postCount: number;
      createdBy: { id: string; name: string };
    }[];
    total: number;
  }>(`/api/v1/groups${qs({ search: params?.search, page: params?.page })}`, { auth: false });
  if (!r.ok) return { ok: false, error: r.error };
  return { ok: true, groups: r.data.groups, total: r.data.total };
}

export async function createGroup(body: {
  name: string;
  description?: string;
  coverUrl?: string | null;
  isPublic?: boolean;
}): Promise<{ ok: true; group: { id: string; name: string; isPublic: boolean } } | { ok: false; error: string }> {
  const r = await apiFetch<{ group: { id: string; name: string; isPublic: boolean } }>('/api/v1/groups', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!r.ok) return { ok: false, error: r.error };
  return { ok: true, group: r.data.group };
}

export type ApiGroupDetail = {
  id: string;
  name: string;
  description: string | null;
  coverUrl: string | null;
  isPublic: boolean;
  createdAt: string;
  memberCount: number;
  postCount: number;
  createdBy: { id: string; name: string };
};

export async function getGroup(
  id: string
): Promise<{ ok: true; group: ApiGroupDetail } | { ok: false; error: string }> {
  const r = await apiFetch<{ group: ApiGroupDetail }>(`/api/v1/groups/${encodeURIComponent(id)}`, {
    auth: false,
  });
  if (!r.ok) return { ok: false, error: r.error };
  return { ok: true, group: r.data.group };
}

export async function joinGroup(
  groupId: string
): Promise<
  | { ok: true; status: 'member' | 'joined' | 'pending' }
  | { ok: false; error: string }
> {
  const r = await apiFetch<{ ok: boolean; status?: 'member' | 'joined' | 'pending' }>(
    `/api/v1/groups/${encodeURIComponent(groupId)}/join`,
    { method: 'POST' }
  );
  if (!r.ok) return { ok: false, error: r.error };
  const st = r.data.status;
  if (st === 'member' || st === 'joined' || st === 'pending') return { ok: true, status: st };
  return { ok: true, status: 'joined' };
}

export async function getGroupMyStatus(
  groupId: string
): Promise<
  | {
      ok: true;
      data:
        | { blocked: true; status: 'blocked'; isPublic: boolean }
        | { blocked: false; status: 'member'; role: string; isPublic: boolean }
        | { blocked: false; status: 'pending'; isPublic: boolean }
        | { blocked: false; status: 'none'; isPublic: boolean };
    }
  | { ok: false; error: string }
> {
  const r = await apiFetch<{
    blocked?: boolean;
    status: string;
    role?: string;
    isPublic: boolean;
  }>(`/api/v1/groups/${encodeURIComponent(groupId)}/my-status`);
  if (!r.ok) return { ok: false, error: r.error };
  const d = r.data;
  if (d.blocked) return { ok: true, data: { blocked: true, status: 'blocked' as const, isPublic: d.isPublic } };
  if (d.status === 'member' && d.role)
    return { ok: true, data: { blocked: false, status: 'member', role: d.role, isPublic: d.isPublic } };
  if (d.status === 'pending') return { ok: true, data: { blocked: false, status: 'pending', isPublic: d.isPublic } };
  return { ok: true, data: { blocked: false, status: 'none', isPublic: d.isPublic } };
}

export async function listMyGroups(): Promise<
  | {
      ok: true;
      groups: {
        id: string;
        name: string;
        description: string | null;
        coverUrl: string | null;
        isPublic: boolean;
        memberCount: number;
        postCount: number;
        createdBy: { id: string; name: string };
        myRole: string;
      }[];
      pendingRequests: {
        groupId: string;
        name: string;
        isPublic: boolean;
        coverUrl: string | null;
        memberCount: number;
        postCount: number;
        requestedAt: string;
      }[];
    }
  | { ok: false; error: string }
> {
  const r = await apiFetch<{
    groups: {
      id: string;
      name: string;
      description: string | null;
      coverUrl: string | null;
      isPublic: boolean;
      memberCount: number;
      postCount: number;
      createdBy: { id: string; name: string };
      myRole: string;
    }[];
    pendingRequests: {
      groupId: string;
      name: string;
      isPublic: boolean;
      coverUrl: string | null;
      memberCount: number;
      postCount: number;
      requestedAt: string;
    }[];
  }>('/api/v1/groups/mine');
  if (!r.ok) return { ok: false, error: r.error };
  return { ok: true, groups: r.data.groups, pendingRequests: r.data.pendingRequests };
}

export async function listGroupJoinRequests(groupId: string): Promise<
  | {
      ok: true;
      requests: { id: string; userId: string; name: string; email: string; createdAt: string }[];
    }
  | { ok: false; error: string }
> {
  const r = await apiFetch<{
    requests: { id: string; userId: string; name: string; email: string; createdAt: string }[];
  }>(`/api/v1/groups/${encodeURIComponent(groupId)}/join-requests`);
  if (!r.ok) return { ok: false, error: r.error };
  return { ok: true, requests: r.data.requests };
}

export async function respondGroupJoinRequest(
  groupId: string,
  userId: string,
  accept: boolean
): Promise<{ ok: true; status: 'approved' | 'rejected' } | { ok: false; error: string }> {
  const r = await apiFetch<{ ok: boolean; status: 'approved' | 'rejected' }>(
    `/api/v1/groups/${encodeURIComponent(groupId)}/join-requests/${encodeURIComponent(userId)}/respond`,
    { method: 'POST', body: JSON.stringify({ accept }) }
  );
  if (!r.ok) return { ok: false, error: r.error };
  return { ok: true, status: r.data.status };
}

export async function blockGroupUser(
  groupId: string,
  userId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const r = await apiFetch<{ ok: boolean }>(
    `/api/v1/groups/${encodeURIComponent(groupId)}/block/${encodeURIComponent(userId)}`,
    { method: 'POST' }
  );
  if (!r.ok) return { ok: false, error: r.error };
  return { ok: true };
}

export async function leaveGroup(groupId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const r = await apiFetch<{ ok: boolean }>(`/api/v1/groups/${encodeURIComponent(groupId)}/leave`, {
    method: 'POST',
  });
  if (!r.ok) return { ok: false, error: r.error };
  return { ok: true };
}

export async function getGroupMyRole(
  groupId: string
): Promise<{ ok: true; role: string } | { ok: false; error: string }> {
  const r = await apiFetch<{ role: string }>(`/api/v1/groups/${encodeURIComponent(groupId)}/me`);
  if (!r.ok) return { ok: false, error: r.error };
  return { ok: true, role: r.data.role };
}

export async function listGroupMembers(groupId: string): Promise<
  | {
      ok: true;
      members: { userId: string; name: string; email: string; role: string; joinedAt: string }[];
    }
  | { ok: false; error: string }
> {
  const r = await apiFetch<{
    members: { userId: string; name: string; email: string; role: string; joinedAt: string }[];
  }>(`/api/v1/groups/${encodeURIComponent(groupId)}/members`);
  if (!r.ok) return { ok: false, error: r.error };
  return { ok: true, members: r.data.members };
}

export async function removeGroupMember(
  groupId: string,
  userId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const r = await apiFetch<{ ok: boolean }>(
    `/api/v1/groups/${encodeURIComponent(groupId)}/members/${encodeURIComponent(userId)}`,
    { method: 'DELETE' }
  );
  if (!r.ok) return { ok: false, error: r.error };
  return { ok: true };
}

export async function getGroupChat(groupId: string): Promise<
  | {
      ok: true;
      messages: { id: string; body: string; createdAt: string; user: { id: string; name: string } }[];
    }
  | { ok: false; error: string }
> {
  const r = await apiFetch<{
    messages: { id: string; body: string; createdAt: string; user: { id: string; name: string } }[];
  }>(`/api/v1/groups/${encodeURIComponent(groupId)}/chat`);
  if (!r.ok) return { ok: false, error: r.error };
  return { ok: true, messages: r.data.messages };
}

export async function sendGroupChatMessage(
  groupId: string,
  body: string
): Promise<
  | {
      ok: true;
      message: { id: string; body: string; createdAt: string; user: { id: string; name: string } };
    }
  | { ok: false; error: string }
> {
  const r = await apiFetch<{
    message: { id: string; body: string; createdAt: string; user: { id: string; name: string } };
  }>(`/api/v1/groups/${encodeURIComponent(groupId)}/chat`, {
    method: 'POST',
    body: JSON.stringify({ body }),
  });
  if (!r.ok) return { ok: false, error: r.error };
  return { ok: true, message: r.data.message };
}

export async function listConversations(): Promise<
  | {
      ok: true;
      conversations: {
        id: string;
        otherUser: { id: string; name: string };
        lastMessage: { body: string; createdAt: string; read: boolean } | null;
      }[];
    }
  | { ok: false; error: string }
> {
  const r = await apiFetch<{
    conversations: {
      id: string;
      otherUser: { id: string; name: string };
      lastMessage: { body: string; createdAt: string; read: boolean } | null;
    }[];
  }>('/api/v1/messages/conversations');
  if (!r.ok) return { ok: false, error: r.error };
  return { ok: true, conversations: r.data.conversations };
}

export async function openOrCreateConversation(otherUserId: string): Promise<
  { ok: true; conversationId: string } | { ok: false; error: string }
> {
  const r = await apiFetch<{ conversationId: string }>('/api/v1/messages/conversations', {
    method: 'POST',
    body: JSON.stringify({ otherUserId }),
  });
  if (!r.ok) return { ok: false, error: r.error };
  return { ok: true, conversationId: r.data.conversationId };
}

export async function getConversationMessages(conversationId: string): Promise<
  | {
      ok: true;
      messages: {
        id: string;
        body: string;
        read: boolean;
        createdAt: string;
        sender: { id: string; name: string };
      }[];
    }
  | { ok: false; error: string }
> {
  const r = await apiFetch<{
    messages: {
      id: string;
      body: string;
      read: boolean;
      createdAt: string;
      sender: { id: string; name: string };
    }[];
  }>(`/api/v1/messages/conversations/${encodeURIComponent(conversationId)}`);
  if (!r.ok) return { ok: false, error: r.error };
  return { ok: true, messages: r.data.messages };
}

export async function sendDirectMessage(
  conversationId: string,
  body: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const r = await apiFetch<{ message: unknown }>(
    `/api/v1/messages/conversations/${encodeURIComponent(conversationId)}/messages`,
    { method: 'POST', body: JSON.stringify({ body }) }
  );
  if (!r.ok) return { ok: false, error: r.error };
  return { ok: true };
}

// --- Superadmin: exam prep ---

export async function superadminListExamCategories(country?: string): Promise<
  { ok: true; categories: Record<string, unknown>[] } | { ok: false; error: string }
> {
  const r = await apiFetch<{ categories: Record<string, unknown>[] }>(
    `/api/v1/superadmin/exam-prep/categories${qs({ country })}`
  );
  if (!r.ok) return { ok: false, error: r.error };
  return { ok: true, categories: r.data.categories };
}

export async function superadminCreateExamCategory(body: {
  label: string;
  slug: string;
  countryCode?: string;
  sortOrder?: number;
  active?: boolean;
}): Promise<{ ok: true; category: Record<string, unknown> } | { ok: false; error: string }> {
  const r = await apiFetch<{ category: Record<string, unknown> }>('/api/v1/superadmin/exam-prep/categories', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!r.ok) return { ok: false, error: r.error };
  return { ok: true, category: r.data.category };
}

export async function superadminListExamCourses(categoryId?: string): Promise<
  { ok: true; courses: Record<string, unknown>[] } | { ok: false; error: string }
> {
  const r = await apiFetch<{ courses: Record<string, unknown>[] }>(
    `/api/v1/superadmin/exam-prep/courses${qs({ categoryId })}`
  );
  if (!r.ok) return { ok: false, error: r.error };
  return { ok: true, courses: r.data.courses };
}

export async function superadminCreateExamCourse(
  body: Record<string, unknown>
): Promise<{ ok: true; course: Record<string, unknown> } | { ok: false; error: string }> {
  const r = await apiFetch<{ course: Record<string, unknown> }>('/api/v1/superadmin/exam-prep/courses', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!r.ok) return { ok: false, error: r.error };
  return { ok: true, course: r.data.course };
}

export type ApiNotification = {
  id: string;
  title: string;
  body: string;
  read: boolean;
  meta: unknown;
  createdAt: string;
};

export async function listNotifications(
  unreadOnly?: boolean
): Promise<{ ok: true; notifications: ApiNotification[] } | { ok: false; error: string }> {
  const r = await apiFetch<{ notifications: ApiNotification[] }>(
    `/api/v1/me/notifications${qs({ unread: unreadOnly ? 1 : undefined })}`
  );
  if (!r.ok) return { ok: false, error: r.error };
  return { ok: true, notifications: r.data.notifications };
}

export async function markNotificationRead(
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const r = await apiFetch<{ ok: boolean }>(`/api/v1/me/notifications/${encodeURIComponent(id)}/read`, {
    method: 'PATCH',
  });
  if (!r.ok) return { ok: false, error: r.error };
  return { ok: true };
}

export async function markAllNotificationsRead(): Promise<{ ok: true } | { ok: false; error: string }> {
  const r = await apiFetch<{ ok: boolean }>('/api/v1/me/notifications/read-all', { method: 'POST' });
  if (!r.ok) return { ok: false, error: r.error };
  return { ok: true };
}

export type AdminListUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions?: unknown;
  createdAt: string;
};

/** Superadmin only: list users with role `admin`. */
export async function superadminListAdmins(): Promise<
  { ok: true; users: AdminListUser[] } | { ok: false; error: string }
> {
  const r = await apiFetch<{ users: AdminListUser[] }>('/api/v1/superadmin/admins');
  if (!r.ok) return { ok: false, error: r.error };
  return { ok: true, users: r.data.users };
}

/** Superadmin only: create an `admin` account. */
export async function superadminCreateAdmin(
  name: string,
  email: string,
  password: string
): Promise<{ ok: true; user: ApiUser } | { ok: false; error: string }> {
  const r = await apiFetch<{ user: ApiUser }>('/api/v1/superadmin/admins', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });
  if (!r.ok) return { ok: false, error: r.error };
  return { ok: true, user: r.data.user };
}

export async function superadminPatchAdminPermissions(
  adminId: string,
  permissions: {
    manageJobs?: boolean;
    manageBlog?: boolean;
    manageSuggestions?: boolean;
    manageQBank?: boolean;
    manageExamPrep?: boolean;
  }
): Promise<{ ok: true; user: AdminListUser } | { ok: false; error: string }> {
  const r = await apiFetch<{ user: AdminListUser }>(`/api/v1/superadmin/admins/${encodeURIComponent(adminId)}`, {
    method: 'PATCH',
    body: JSON.stringify({ permissions }),
  });
  if (!r.ok) return { ok: false, error: r.error };
  return { ok: true, user: r.data.user };
}

// --- Public stats (home page) ---

export async function fetchPublicStats(): Promise<
  | { ok: true; jobsPublished: number; activeUsers: number; examsCovered: number }
  | { ok: false; error: string }
> {
  const r = await apiFetch<{
    jobsPublished: number;
    activeUsers: number;
    examsCovered: number;
  }>('/api/v1/stats', { auth: false });
  if (!r.ok) return { ok: false, error: r.error };
  return { ok: true, ...r.data };
}

// --- Question bank ---

export type ApiQBankItem = {
  id: string;
  title: string;
  category: string;
  year: string;
  solved: boolean;
  description: string | null;
  pdfUrl: string | null;
  countryCode: string;
  sortOrder: number;
  published: boolean;
  createdAt: string;
  updatedAt: string;
};

export async function listQBankItems(params?: {
  country?: string;
  category?: string;
  search?: string;
}): Promise<{ ok: true; items: ApiQBankItem[] } | { ok: false; error: string }> {
  const r = await apiFetch<{ items: ApiQBankItem[] }>(
    `/api/v1/qbank${qs({
      country: params?.country,
      category: params?.category,
      search: params?.search,
    })}`,
    { auth: false }
  );
  if (!r.ok) return { ok: false, error: r.error };
  return { ok: true, items: r.data.items };
}

export async function getQBankItem(
  id: string
): Promise<{ ok: true; item: ApiQBankItem } | { ok: false; error: string }> {
  const r = await apiFetch<{ item: ApiQBankItem }>(`/api/v1/qbank/${encodeURIComponent(id)}`, {
    auth: false,
  });
  if (!r.ok) return { ok: false, error: r.error };
  return { ok: true, item: r.data.item };
}

export async function adminListQBank(): Promise<
  { ok: true; items: ApiQBankItem[] } | { ok: false; error: string }
> {
  const r = await apiFetch<{ items: ApiQBankItem[] }>('/api/v1/admin/qbank');
  if (!r.ok) return { ok: false, error: r.error };
  return { ok: true, items: r.data.items };
}

export async function adminCreateQBankItem(
  body: Record<string, unknown>
): Promise<{ ok: true; item: ApiQBankItem } | { ok: false; error: string }> {
  const r = await apiFetch<{ item: ApiQBankItem }>('/api/v1/admin/qbank', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!r.ok) return { ok: false, error: r.error };
  return { ok: true, item: r.data.item };
}

export async function adminUpdateQBankItem(
  id: string,
  body: Record<string, unknown>
): Promise<{ ok: true; item: ApiQBankItem } | { ok: false; error: string }> {
  const r = await apiFetch<{ item: ApiQBankItem }>(`/api/v1/admin/qbank/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
  if (!r.ok) return { ok: false, error: r.error };
  return { ok: true, item: r.data.item };
}

export async function adminDeleteQBankItem(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const r = await apiFetch<{ ok: boolean }>(`/api/v1/admin/qbank/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  if (!r.ok) return { ok: false, error: r.error };
  return { ok: true };
}

// --- Admin: blog ---

export type ApiBlogAdminItem = ApiBlogListItem & { content: string };

export async function adminListBlogPosts(): Promise<
  { ok: true; posts: ApiBlogAdminItem[] } | { ok: false; error: string }
> {
  const r = await apiFetch<{ posts: ApiBlogAdminItem[] }>('/api/v1/admin/blog');
  if (!r.ok) return { ok: false, error: r.error };
  return { ok: true, posts: r.data.posts };
}

export async function adminCreateBlogPost(
  body: Record<string, unknown>
): Promise<{ ok: true; post: ApiBlogDetail } | { ok: false; error: string }> {
  const r = await apiFetch<{ post: ApiBlogDetail }>('/api/v1/admin/blog', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!r.ok) return { ok: false, error: r.error };
  return { ok: true, post: r.data.post };
}

export async function adminUpdateBlogPost(
  id: string,
  body: Record<string, unknown>
): Promise<{ ok: true; post: ApiBlogDetail } | { ok: false; error: string }> {
  const r = await apiFetch<{ post: ApiBlogDetail }>(`/api/v1/admin/blog/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
  if (!r.ok) return { ok: false, error: r.error };
  return { ok: true, post: r.data.post };
}

export async function adminDeleteBlogPost(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const r = await apiFetch<{ ok: boolean }>(`/api/v1/admin/blog/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  if (!r.ok) return { ok: false, error: r.error };
  return { ok: true };
}

// --- Admin: suggestions ---

export type ApiSuggestionAdmin = {
  id: string;
  title: string;
  summary: string;
  category: string;
  countryCode: string;
  content: string | null;
  externalUrl: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export async function adminListSuggestions(): Promise<
  { ok: true; suggestions: ApiSuggestionAdmin[] } | { ok: false; error: string }
> {
  const r = await apiFetch<{ suggestions: ApiSuggestionAdmin[] }>('/api/v1/admin/suggestions');
  if (!r.ok) return { ok: false, error: r.error };
  return { ok: true, suggestions: r.data.suggestions };
}

export async function adminCreateSuggestion(
  body: Record<string, unknown>
): Promise<{ ok: true; suggestion: ApiSuggestionAdmin } | { ok: false; error: string }> {
  const r = await apiFetch<{ suggestion: ApiSuggestionAdmin }>('/api/v1/admin/suggestions', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!r.ok) return { ok: false, error: r.error };
  return { ok: true, suggestion: r.data.suggestion };
}

export async function adminUpdateSuggestion(
  id: string,
  body: Record<string, unknown>
): Promise<{ ok: true; suggestion: ApiSuggestionAdmin } | { ok: false; error: string }> {
  const r = await apiFetch<{ suggestion: ApiSuggestionAdmin }>(
    `/api/v1/admin/suggestions/${encodeURIComponent(id)}`,
    { method: 'PATCH', body: JSON.stringify(body) }
  );
  if (!r.ok) return { ok: false, error: r.error };
  return { ok: true, suggestion: r.data.suggestion };
}

export async function adminDeleteSuggestion(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const r = await apiFetch<{ ok: boolean }>(`/api/v1/admin/suggestions/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  if (!r.ok) return { ok: false, error: r.error };
  return { ok: true };
}
