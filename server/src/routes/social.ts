import type { FastifyInstance } from 'fastify';
import { prisma } from '../db.js';
import { getOptionalUserId } from '../authz/optionalAuth.js';
import { notifyUser } from '../lib/notify.js';
import { sanitizeRichHtml } from '../lib/sanitizeHtml.js';

const P = '/api/v1';

function normEmoji(e: string) {
  const s = e.trim() || '👍';
  if (s.length > 8) return '👍';
  return s;
}

export function registerSocialRoutes(app: FastifyInstance) {
  /** List feed: global news feed = public posts only (groupId null). Group pages pass groupId. */
  app.get<{
    Querystring: { groupId?: string; page?: string; limit?: string; merge?: string };
  }>(`${P}/feed`, async (req, reply) => {
    const page = Math.max(1, parseInt(req.query.page || '1', 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || '20', 10) || 20));
    const skip = (page - 1) * limit;
    const groupId = req.query.groupId?.trim() || undefined;

    const uid = await getOptionalUserId(req);

    if (groupId) {
      if (!uid) return reply.code(401).send({ error: 'login required' });
      const gm = await prisma.groupMember.findUnique({
        where: { groupId_userId: { groupId, userId: uid } },
      });
      if (!gm) return reply.code(403).send({ error: 'members only' });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let where: any;
    if (groupId) {
      where = { groupId };
    } else {
      where = { groupId: null };
    }

    const [total, rows] = await prisma.$transaction([
      prisma.feedPost.count({ where }),
      prisma.feedPost.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: { select: { id: true, name: true } },
          images: { orderBy: { sortOrder: 'asc' } },
          group: { select: { id: true, name: true } },
        },
      }),
    ]);

    const ids = rows.map((r) => r.id);

    const reactionRows =
      ids.length === 0
        ? []
        : await prisma.contentReaction.findMany({
            where: { targetType: 'feed_post', targetId: { in: ids } },
          });
    const reactByPost = new Map<string, { emoji: string; count: number }[]>();
    const emojiAcc = new Map<string, Map<string, number>>();
    for (const r of reactionRows) {
      if (!emojiAcc.has(r.targetId)) emojiAcc.set(r.targetId, new Map());
      const m = emojiAcc.get(r.targetId)!;
      m.set(r.emoji, (m.get(r.emoji) || 0) + 1);
    }
    for (const [tid, em] of emojiAcc) {
      reactByPost.set(
        tid,
        [...em.entries()].map(([emoji, count]) => ({ emoji, count }))
      );
    }
    const myReactions = new Map<string, string>();
    if (uid) {
      for (const r of reactionRows) {
        if (r.userId === uid) myReactions.set(r.targetId, r.emoji);
      }
    }

    const posts = rows.map((p) => ({
      id: p.id,
      body: p.body,
      bodyHtml: p.bodyHtml ?? null,
      viewCount: p.viewCount,
      shareCount: p.shareCount,
      createdAt: p.createdAt,
      user: p.user,
      group: p.group ? { id: p.group.id, name: p.group.name } : null,
      images: p.images.map((i) => ({ url: i.url, sortOrder: i.sortOrder })),
      reactions: reactByPost.get(p.id) || [],
      myReaction: myReactions.get(p.id) ?? null,
    }));

    return { posts, page, limit, total };
  });

  app.post<{
    Body: { body?: string; bodyHtml?: string | null; imageUrls?: string[]; groupId?: string | null };
  }>(`${P}/feed/posts`, { preHandler: [app.authenticate] }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const plain = String(req.body?.body || '').trim();
    const rawHtml =
      req.body?.bodyHtml !== undefined && req.body?.bodyHtml !== null
        ? String(req.body.bodyHtml)
        : '';
    const bodyHtml = rawHtml ? sanitizeRichHtml(rawHtml) : null;
    const imageUrls = Array.isArray(req.body?.imageUrls)
      ? req.body.imageUrls.map((u) => String(u).trim()).filter(Boolean).slice(0, 12)
      : [];
    const groupId = req.body?.groupId ? String(req.body.groupId) : null;

    if (!plain && !bodyHtml && imageUrls.length === 0) {
      return reply.code(400).send({ error: 'empty post' });
    }
    if (plain.length > 8000) {
      return reply.code(400).send({ error: 'text too long' });
    }

    const snippet =
      plain ||
      (bodyHtml ? bodyHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 600) : '') ||
      (imageUrls.length ? 'Photo' : '');

    if (groupId) {
      const m = await prisma.groupMember.findUnique({
        where: { groupId_userId: { groupId, userId: sub } },
      });
      if (!m) return reply.code(403).send({ error: 'not a group member' });
    }

    const post = await prisma.feedPost.create({
      data: {
        userId: sub,
        body: snippet,
        bodyHtml: bodyHtml || undefined,
        groupId: groupId || undefined,
        images: {
          create: imageUrls.map((url, i) => ({ url, sortOrder: i })),
        },
      },
      include: {
        user: { select: { id: true, name: true } },
        images: true,
        group: { select: { id: true, name: true } },
      },
    });

    if (groupId && post.group) {
      const others = await prisma.groupMember.findMany({
        where: { groupId, userId: { not: sub } },
        take: 40,
        select: { userId: true },
      });
      const actorName = post.user.name;
      for (const o of others) {
        await notifyUser(o.userId, `New post in ${post.group.name}`, `${actorName} shared an update`, {
          kind: 'group_post',
          groupId: post.group.id,
          postId: post.id,
        });
      }
    }

    return {
      post: {
        id: post.id,
        body: post.body,
        bodyHtml: post.bodyHtml ?? null,
        viewCount: post.viewCount,
        shareCount: post.shareCount,
        createdAt: post.createdAt,
        user: post.user,
        group: post.group ? { id: post.group.id, name: post.group.name } : null,
        images: post.images.map((i) => ({ url: i.url, sortOrder: i.sortOrder })),
        reactions: [],
        myReaction: null,
      },
    };
  });

  app.get<{ Params: { id: string } }>(`${P}/feed/posts/:id`, async (req, reply) => {
    const post = await prisma.feedPost.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { id: true, name: true } },
        images: { orderBy: { sortOrder: 'asc' } },
        group: { select: { id: true, name: true } },
      },
    });
    if (!post) return reply.code(404).send({ error: 'not found' });

    await prisma.feedPost.update({
      where: { id: post.id },
      data: { viewCount: { increment: 1 } },
    });

    const uid = await getOptionalUserId(req);
    const reactions = await prisma.contentReaction.findMany({
      where: { targetType: 'feed_post', targetId: post.id },
    });
    const emojiMap = new Map<string, number>();
    for (const r of reactions) {
      emojiMap.set(r.emoji, (emojiMap.get(r.emoji) || 0) + 1);
    }
    const reactList = [...emojiMap.entries()].map(([emoji, count]) => ({ emoji, count }));
    let myReaction: string | null = null;
    if (uid) {
      const mine = reactions.find((r) => r.userId === uid);
      myReaction = mine?.emoji ?? null;
    }

    return {
      post: {
        id: post.id,
        body: post.body,
        bodyHtml: post.bodyHtml ?? null,
        viewCount: post.viewCount + 1,
        shareCount: post.shareCount,
        createdAt: post.createdAt,
        user: post.user,
        group: post.group ? { id: post.group.id, name: post.group.name } : null,
        images: post.images.map((i) => ({ url: i.url, sortOrder: i.sortOrder })),
        reactions: reactList,
        myReaction,
      },
    };
  });

  app.post<{ Params: { id: string } }>(`${P}/feed/posts/:id/share`, async (req, reply) => {
    const p = await prisma.feedPost.findUnique({ where: { id: req.params.id } });
    if (!p) return reply.code(404).send({ error: 'not found' });
    await prisma.feedPost.update({
      where: { id: p.id },
      data: { shareCount: { increment: 1 } },
    });
    return { ok: true, shareCount: p.shareCount + 1 };
  });

  /** Toggle / set emoji reaction */
  app.post<{
    Body: { targetType?: string; targetId?: string; emoji?: string };
  }>(`${P}/reactions`, { preHandler: [app.authenticate] }, async (req, reply) => {
    const targetType = String(req.body?.targetType || '');
    const targetId = String(req.body?.targetId || '');
    const emoji = normEmoji(String(req.body?.emoji || '👍'));
    if (!['comment', 'feed_post', 'job'].includes(targetType) || !targetId) {
      return reply.code(400).send({ error: 'invalid target' });
    }

    const { sub } = req.user as { sub: string };

    const existing = await prisma.contentReaction.findUnique({
      where: {
        userId_targetType_targetId: { userId: sub, targetType, targetId },
      },
    });

    let removed = false;
    if (existing) {
      if (existing.emoji === emoji) {
        await prisma.contentReaction.delete({ where: { id: existing.id } });
        removed = true;
      } else {
        await prisma.contentReaction.update({
          where: { id: existing.id },
          data: { emoji },
        });
      }
    } else {
      await prisma.contentReaction.create({
        data: { userId: sub, targetType, targetId, emoji },
      });
    }

    if (!removed) {
      if (targetType === 'comment') {
        const c = await prisma.comment.findUnique({ where: { id: targetId } });
        if (c && c.userId !== sub) {
          const actor = await prisma.user.findUnique({ where: { id: sub } });
          await notifyUser(c.userId, 'Reaction on your comment', `${actor?.name ?? 'Someone'} reacted ${emoji}`, {
            kind: 'reaction_comment',
            commentId: targetId,
            targetType: c.targetType,
            targetId: c.targetId,
            emoji,
          });
        }
      } else if (targetType === 'feed_post') {
        const p = await prisma.feedPost.findUnique({ where: { id: targetId } });
        if (p && p.userId !== sub) {
          const actor = await prisma.user.findUnique({ where: { id: sub } });
          await notifyUser(p.userId, 'Reaction on your post', `${actor?.name ?? 'Someone'} reacted ${emoji}`, {
            kind: 'reaction_feed',
            postId: targetId,
            emoji,
          });
        }
      }
    }

    const counts = await prisma.contentReaction.groupBy({
      by: ['emoji'],
      where: { targetType, targetId },
      _count: { emoji: true },
    });
    const mine = await prisma.contentReaction.findUnique({
      where: {
        userId_targetType_targetId: { userId: sub, targetType, targetId },
      },
    });
    return {
      ok: true,
      removed,
      reactions: counts.map((x) => ({ emoji: x.emoji, count: x._count.emoji })),
      myReaction: mine?.emoji ?? null,
    };
  });

  app.delete<{
    Querystring: { targetType?: string; targetId?: string };
  }>(`${P}/reactions`, { preHandler: [app.authenticate] }, async (req, reply) => {
    const targetType = String(req.query.targetType || '');
    const targetId = String(req.query.targetId || '');
    if (!targetType || !targetId) return reply.code(400).send({ error: 'invalid' });
    const { sub } = req.user as { sub: string };
    await prisma.contentReaction.deleteMany({
      where: { userId: sub, targetType, targetId },
    });
    return { ok: true };
  });

  /** Follow user */
  app.post<{ Params: { userId: string } }>(
    `${P}/social/follow/:userId`,
    { preHandler: [app.authenticate] },
    async (req, reply) => {
      const { sub } = req.user as { sub: string };
      const target = req.params.userId;
      if (target === sub) return reply.code(400).send({ error: 'cannot follow self' });
      const u = await prisma.user.findUnique({ where: { id: target } });
      if (!u) return reply.code(404).send({ error: 'user not found' });
      await prisma.follow.upsert({
        where: { followerId_followingId: { followerId: sub, followingId: target } },
        create: { followerId: sub, followingId: target },
        update: {},
      });
      await notifyUser(target, 'New follower', `Someone started following you`, {
        kind: 'follow',
        userId: sub,
      });
      return { ok: true };
    }
  );

  app.delete<{ Params: { userId: string } }>(
    `${P}/social/follow/:userId`,
    { preHandler: [app.authenticate] },
    async (req) => {
      const { sub } = req.user as { sub: string };
      await prisma.follow.deleteMany({
        where: { followerId: sub, followingId: req.params.userId },
      });
      return { ok: true };
    }
  );

  app.get(`${P}/social/following`, { preHandler: [app.authenticate] }, async (req) => {
    const { sub } = req.user as { sub: string };
    const rows = await prisma.follow.findMany({
      where: { followerId: sub },
      include: { following: { select: { id: true, name: true, email: true } } },
    });
    return { users: rows.map((r) => r.following) };
  });

  app.get(`${P}/social/followers`, { preHandler: [app.authenticate] }, async (req) => {
    const { sub } = req.user as { sub: string };
    const rows = await prisma.follow.findMany({
      where: { followingId: sub },
      include: { follower: { select: { id: true, name: true, email: true } } },
    });
    return { users: rows.map((r) => r.follower) };
  });

  /** Connection requests */
  app.post<{
    Body: { toUserId?: string };
  }>(`${P}/social/connections/request`, { preHandler: [app.authenticate] }, async (req, reply) => {
    const to = String(req.body?.toUserId || '');
    const { sub } = req.user as { sub: string };
    if (!to || to === sub) return reply.code(400).send({ error: 'invalid' });
    const u = await prisma.user.findUnique({ where: { id: to } });
    if (!u) return reply.code(404).send({ error: 'not found' });
    await prisma.connectionRequest.upsert({
      where: { fromUserId_toUserId: { fromUserId: sub, toUserId: to } },
      create: { fromUserId: sub, toUserId: to, status: 'pending' },
      update: { status: 'pending' },
    });
    await notifyUser(to, 'Connection request', `You have a new connection request`, {
      kind: 'connection_request',
      fromUserId: sub,
    });
    return { ok: true };
  });

  app.post<{ Params: { id: string }; Body: { accept?: boolean } }>(
    `${P}/social/connections/:id/respond`,
    { preHandler: [app.authenticate] },
    async (req, reply) => {
      const { sub } = req.user as { sub: string };
      const row = await prisma.connectionRequest.findUnique({ where: { id: req.params.id } });
      if (!row || row.toUserId !== sub) return reply.code(404).send({ error: 'not found' });
      const accept = Boolean(req.body?.accept);
      await prisma.connectionRequest.update({
        where: { id: row.id },
        data: { status: accept ? 'accepted' : 'rejected' },
      });
      if (accept) {
        await notifyUser(row.fromUserId, 'Connection accepted', `Your connection request was accepted`, {
          kind: 'connection_accepted',
          userId: sub,
        });
      }
      return { ok: true, status: accept ? 'accepted' : 'rejected' };
    }
  );

  /** Accepted connections (LinkedIn-style network) */
  app.get(`${P}/social/connections`, { preHandler: [app.authenticate] }, async (req) => {
    const { sub } = req.user as { sub: string };
    const rows = await prisma.connectionRequest.findMany({
      where: {
        status: 'accepted',
        OR: [{ fromUserId: sub }, { toUserId: sub }],
      },
      include: {
        fromUser: { select: { id: true, name: true, email: true } },
        toUser: { select: { id: true, name: true, email: true } },
      },
    });
    const users = rows.map((r) => {
      const other = r.fromUserId === sub ? r.toUser : r.fromUser;
      return { id: other.id, name: other.name, email: other.email };
    });
    return { connections: users };
  });

  app.get(`${P}/social/connections/incoming`, { preHandler: [app.authenticate] }, async (req) => {
    const { sub } = req.user as { sub: string };
    const rows = await prisma.connectionRequest.findMany({
      where: { toUserId: sub, status: 'pending' },
      include: { fromUser: { select: { id: true, name: true, email: true } } },
    });
    return {
      requests: rows.map((r) => ({
        id: r.id,
        fromUser: r.fromUser,
        createdAt: r.createdAt,
      })),
    };
  });

  /** Search users (for connections / follow) */
  app.get<{
    Querystring: { q?: string; limit?: string };
  }>(`${P}/social/users/search`, { preHandler: [app.authenticate] }, async (req) => {
    const q = (req.query.q || '').trim();
    const limit = Math.min(30, Math.max(1, parseInt(req.query.limit || '15', 10) || 15));
    if (q.length < 2) return { users: [] };
    const users = await prisma.user.findMany({
      where: {
        OR: [{ name: { contains: q } }, { email: { contains: q } }],
        role: 'user',
      },
      take: limit,
      select: { id: true, name: true, email: true, countryCode: true },
    });
    return { users };
  });
}
