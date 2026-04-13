import type { FastifyInstance } from 'fastify';
import { prisma } from '../db.js';
import { notifyUser } from '../lib/notify.js';
import { getOptionalUserId } from '../authz/optionalAuth.js';

const P = '/api/v1';
const TARGETS = ['job', 'blog', 'feed'] as const;

type CommentRow = {
  id: string;
  body: string;
  createdAt: Date;
  parentId: string | null;
  userId: string;
  user: { id: string; name: string };
};

async function attachReactionsAndMine(
  targetType: string,
  ids: string[],
  userId: string | null
) {
  const reactions = await prisma.contentReaction.findMany({
    where: { targetType, targetId: { in: ids } },
  });
  const byTarget = new Map<string, { emoji: string; count: number }[]>();
  const emojiMap = new Map<string, Map<string, number>>();
  for (const r of reactions) {
    if (!emojiMap.has(r.targetId)) emojiMap.set(r.targetId, new Map());
    const m = emojiMap.get(r.targetId)!;
    m.set(r.emoji, (m.get(r.emoji) || 0) + 1);
  }
  for (const [tid, em] of emojiMap) {
    byTarget.set(
      tid,
      [...em.entries()].map(([emoji, count]) => ({ emoji, count }))
    );
  }
  const mine = new Map<string, string>();
  if (userId) {
    const mineRows = reactions.filter((r) => r.userId === userId);
    for (const r of mineRows) mine.set(r.targetId, r.emoji);
  }
  return { byTarget, mine };
}

function nestComments(
  flat: CommentRow[],
  reactions: Map<string, { emoji: string; count: number }[]>,
  myEmoji: Map<string, string>
) {
  const map = new Map<string | 'root', CommentRow[]>();
  for (const c of flat) {
    const k = c.parentId ?? 'root';
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(c);
  }
  const build = (parentKey: string | 'root'): unknown[] => {
    const list = map.get(parentKey) || [];
    return list.map((c) => ({
      id: c.id,
      body: c.body,
      createdAt: c.createdAt,
      parentId: c.parentId,
      user: c.user,
      reactions: reactions.get(c.id) || [],
      myReaction: myEmoji.get(c.id) ?? null,
      replies: build(c.id),
    }));
  };
  return build('root');
}

export function registerCommentRoutes(app: FastifyInstance) {
  app.get<{
    Params: { targetType: string; targetId: string };
  }>(`${P}/comments/:targetType/:targetId`, async (req, reply) => {
    const { targetType, targetId } = req.params;
    if (!TARGETS.includes(targetType as (typeof TARGETS)[number])) {
      return reply.code(400).send({ error: 'invalid target' });
    }

    const uid = await getOptionalUserId(req);

    const rows = await prisma.comment.findMany({
      where: { targetType, targetId },
      orderBy: { createdAt: 'asc' },
      take: 500,
      include: {
        user: { select: { id: true, name: true } },
      },
    });

    const flat: CommentRow[] = rows.map((c) => ({
      id: c.id,
      body: c.body,
      createdAt: c.createdAt,
      parentId: c.parentId,
      userId: c.userId,
      user: c.user,
    }));

    const commentIds = flat.map((c) => c.id);
    const { byTarget, mine } = await attachReactionsAndMine('comment', commentIds, uid);

    const nested = nestComments(flat, byTarget, mine);
    return { comments: nested };
  });

  app.post<{
    Params: { targetType: string; targetId: string };
    Body: { body?: string; parentId?: string | null };
  }>(`${P}/comments/:targetType/:targetId`, { preHandler: [app.authenticate] }, async (req, reply) => {
    const { targetType, targetId } = req.params;
    if (!TARGETS.includes(targetType as (typeof TARGETS)[number])) {
      return reply.code(400).send({ error: 'invalid target' });
    }

    const text = String(req.body?.body || '').trim();
    if (text.length < 1 || text.length > 5000) {
      return reply.code(400).send({ error: 'invalid body' });
    }

    const parentId = req.body?.parentId ? String(req.body.parentId) : null;
    const { sub } = req.user as { sub: string };

    if (targetType === 'job') {
      const j = await prisma.job.findUnique({ where: { id: targetId } });
      if (!j || j.status !== 'published') return reply.code(404).send({ error: 'not found' });
    } else if (targetType === 'blog') {
      const p = await prisma.blogPost.findUnique({ where: { id: targetId } });
      if (!p || !p.published) return reply.code(404).send({ error: 'not found' });
    } else {
      const post = await prisma.feedPost.findUnique({ where: { id: targetId } });
      if (!post) return reply.code(404).send({ error: 'not found' });
    }

    if (parentId) {
      const parent = await prisma.comment.findFirst({
        where: { id: parentId, targetType, targetId },
      });
      if (!parent) return reply.code(400).send({ error: 'invalid parent' });
    }

    const c = await prisma.comment.create({
      data: {
        userId: sub,
        targetType,
        targetId,
        body: text,
        parentId: parentId || undefined,
      },
      include: { user: { select: { id: true, name: true } } },
    });

    // Notifications
    if (parentId) {
      const parent = await prisma.comment.findUnique({ where: { id: parentId } });
      if (parent && parent.userId !== sub) {
        await notifyUser(parent.userId, 'New reply', `${c.user.name} replied to your comment`, {
          kind: 'comment_reply',
          targetType,
          targetId,
          commentId: c.id,
          parentId,
        });
      }
    } else if (targetType === 'feed') {
      const post = await prisma.feedPost.findUnique({ where: { id: targetId } });
      if (post && post.userId !== sub) {
        await notifyUser(post.userId, 'New comment on your post', `${c.user.name} commented`, {
          kind: 'feed_comment',
          postId: targetId,
          commentId: c.id,
        });
      }
    } else if (targetType === 'job') {
      const job = await prisma.job.findUnique({ where: { id: targetId } });
      if (job) {
        const org = await prisma.user.findMany({
          where: { role: 'admin' },
          take: 5,
          select: { id: true },
        });
        for (const u of org) {
          await notifyUser(u.id, 'Job comment', `${c.user.name} on ${job.title}`, {
            kind: 'job_comment',
            jobId: targetId,
            commentId: c.id,
          });
        }
      }
    }

    return {
      comment: {
        id: c.id,
        body: c.body,
        createdAt: c.createdAt,
        parentId: c.parentId,
        user: c.user,
        reactions: [],
        myReaction: null,
        replies: [],
      },
    };
  });
}
