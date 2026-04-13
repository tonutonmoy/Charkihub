import type { FastifyInstance } from 'fastify';
import { prisma } from '../db.js';
import { notifyUser } from '../lib/notify.js';

const P = '/api/v1';

async function notifyGroupAdmins(
  groupId: string,
  title: string,
  body: string,
  meta: Record<string, unknown>,
  excludeUserId?: string
) {
  const admins = await prisma.groupMember.findMany({
    where: {
      groupId,
      role: 'admin',
      ...(excludeUserId ? { userId: { not: excludeUserId } } : {}),
    },
    select: { userId: true },
  });
  for (const a of admins) {
    await notifyUser(a.userId, title, body, meta);
  }
}

export function registerGroupRoutes(app: FastifyInstance) {
  /** Discovery: public groups only */
  app.get<{
    Querystring: { search?: string; page?: string; limit?: string };
  }>(`${P}/groups`, async (req) => {
    const page = Math.max(1, parseInt(req.query.page || '1', 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || '20', 10) || 20));
    const skip = (page - 1) * limit;
    const search = (req.query.search || '').trim();

    const where = search
      ? {
          isPublic: true,
          OR: [{ name: { contains: search } }, { description: { contains: search } }],
        }
      : { isPublic: true };

    const [total, rows] = await prisma.$transaction([
      prisma.group.count({ where }),
      prisma.group.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          _count: { select: { members: true, posts: true } },
          createdBy: { select: { id: true, name: true } },
        },
      }),
    ]);

    return {
      groups: rows.map((g) => ({
        id: g.id,
        name: g.name,
        description: g.description,
        coverUrl: g.coverUrl,
        isPublic: g.isPublic,
        createdAt: g.createdAt,
        memberCount: g._count.members,
        postCount: g._count.posts,
        createdBy: g.createdBy,
      })),
      page,
      limit,
      total,
    };
  });

  /** Groups you belong to (public + private) + pending join requests */
  app.get<{
    Querystring: { page?: string; limit?: string };
  }>(`${P}/groups/mine`, { preHandler: [app.authenticate] }, async (req) => {
    const { sub } = req.user as { sub: string };
    const page = Math.max(1, parseInt(req.query.page || '1', 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || '30', 10) || 30));
    const skip = (page - 1) * limit;

    const memberships = await prisma.groupMember.findMany({
      where: { userId: sub },
      include: {
        group: {
          include: {
            createdBy: { select: { id: true, name: true } },
            _count: { select: { members: true, posts: true } },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
      skip,
      take: limit,
    });

    const pendingReqs = await prisma.groupJoinRequest.findMany({
      where: { userId: sub, status: 'pending' },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            isPublic: true,
            coverUrl: true,
            _count: { select: { members: true, posts: true } },
          },
        },
      },
    });

    return {
      groups: memberships.map((m) => ({
        id: m.group.id,
        name: m.group.name,
        description: m.group.description,
        coverUrl: m.group.coverUrl,
        isPublic: m.group.isPublic,
        createdAt: m.group.createdAt,
        memberCount: m.group._count.members,
        postCount: m.group._count.posts,
        createdBy: m.group.createdBy,
        myRole: m.role,
      })),
      pendingRequests: pendingReqs.map((r) => ({
        groupId: r.group.id,
        name: r.group.name,
        isPublic: r.group.isPublic,
        coverUrl: r.group.coverUrl,
        memberCount: r.group._count.members,
        postCount: r.group._count.posts,
        requestedAt: r.createdAt,
      })),
      page,
      limit,
    };
  });

  app.post<{
    Body: { name?: string; description?: string; coverUrl?: string; isPublic?: boolean };
  }>(`${P}/groups`, { preHandler: [app.authenticate] }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const name = String(req.body?.name || '').trim();
    if (name.length < 2 || name.length > 120) {
      return reply.code(400).send({ error: 'invalid name' });
    }
    const g = await prisma.group.create({
      data: {
        name,
        description: req.body?.description ? String(req.body.description).slice(0, 2000) : null,
        coverUrl: req.body?.coverUrl ? String(req.body.coverUrl).slice(0, 2000) : null,
        isPublic: req.body?.isPublic !== false,
        createdById: sub,
        members: { create: { userId: sub, role: 'admin' } },
      },
    });
    await notifyUser(sub, 'Group created', `You created ${g.name}. You are an admin.`, {
      kind: 'group_created',
      groupId: g.id,
    });
    return { group: { id: g.id, name: g.name, isPublic: g.isPublic } };
  });

  app.get<{ Params: { id: string } }>(`${P}/groups/:id`, async (req, reply) => {
    const g = await prisma.group.findUnique({
      where: { id: req.params.id },
      include: {
        createdBy: { select: { id: true, name: true } },
        _count: { select: { members: true, posts: true } },
      },
    });
    if (!g) return reply.code(404).send({ error: 'not found' });
    return {
      group: {
        id: g.id,
        name: g.name,
        description: g.description,
        coverUrl: g.coverUrl,
        isPublic: g.isPublic,
        createdAt: g.createdAt,
        createdBy: g.createdBy,
        memberCount: g._count.members,
        postCount: g._count.posts,
      },
    };
  });

  /** Membership, pending request, or blocked — for join UI */
  app.get<{ Params: { id: string } }>(`${P}/groups/:id/my-status`, { preHandler: [app.authenticate] }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const g = await prisma.group.findUnique({ where: { id: req.params.id } });
    if (!g) return reply.code(404).send({ error: 'not found' });

    const blocked = await prisma.groupBlockedUser.findUnique({
      where: { groupId_userId: { groupId: g.id, userId: sub } },
    });
    if (blocked) {
      return { blocked: true, status: 'blocked' as const, isPublic: g.isPublic };
    }

    const mem = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: g.id, userId: sub } },
    });
    if (mem) {
      return { blocked: false, status: 'member' as const, role: mem.role, isPublic: g.isPublic };
    }

    const jr = await prisma.groupJoinRequest.findUnique({
      where: { groupId_userId: { groupId: g.id, userId: sub } },
    });
    if (jr?.status === 'pending') {
      return { blocked: false, status: 'pending' as const, isPublic: g.isPublic };
    }

    return { blocked: false, status: 'none' as const, isPublic: g.isPublic };
  });

  app.post<{ Params: { id: string } }>(`${P}/groups/:id/join`, { preHandler: [app.authenticate] }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const g = await prisma.group.findUnique({ where: { id: req.params.id } });
    if (!g) return reply.code(404).send({ error: 'not found' });

    const blocked = await prisma.groupBlockedUser.findUnique({
      where: { groupId_userId: { groupId: g.id, userId: sub } },
    });
    if (blocked) return reply.code(403).send({ error: 'blocked from group' });

    const existing = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: g.id, userId: sub } },
    });
    if (existing) return { ok: true, status: 'member' as const };

    if (g.isPublic) {
      await prisma.groupMember.create({
        data: { groupId: g.id, userId: sub, role: 'member' },
      });
      await notifyUser(g.createdById, 'New group member', `Someone joined ${g.name}`, {
        kind: 'group_join',
        groupId: g.id,
        userId: sub,
      });
      return { ok: true, status: 'joined' as const };
    }

    const prev = await prisma.groupJoinRequest.findUnique({
      where: { groupId_userId: { groupId: g.id, userId: sub } },
    });
    if (prev?.status === 'pending') {
      return reply.code(409).send({ error: 'request already pending' });
    }

    await prisma.groupJoinRequest.upsert({
      where: { groupId_userId: { groupId: g.id, userId: sub } },
      create: { groupId: g.id, userId: sub, status: 'pending' },
      update: { status: 'pending' },
    });

    const actor = await prisma.user.findUnique({ where: { id: sub }, select: { name: true } });
    await notifyGroupAdmins(
      g.id,
      'Join request',
      `${actor?.name ?? 'Someone'} wants to join ${g.name}`,
      { kind: 'group_join_request', groupId: g.id, userId: sub },
      sub
    );

    return { ok: true, status: 'pending' as const };
  });

  app.get<{ Params: { id: string } }>(`${P}/groups/:id/join-requests`, { preHandler: [app.authenticate] }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const g = await prisma.group.findUnique({ where: { id: req.params.id } });
    if (!g) return reply.code(404).send({ error: 'not found' });
    const admin = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: g.id, userId: sub } },
    });
    if (!admin || admin.role !== 'admin') return reply.code(403).send({ error: 'admin only' });

    const rows = await prisma.groupJoinRequest.findMany({
      where: { groupId: g.id, status: 'pending' },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'asc' },
    });
    return {
      requests: rows.map((r) => ({
        id: r.id,
        userId: r.userId,
        name: r.user.name,
        email: r.user.email,
        createdAt: r.createdAt,
      })),
    };
  });

  app.post<{
    Params: { id: string; userId: string };
    Body: { accept?: boolean };
  }>(`${P}/groups/:id/join-requests/:userId/respond`, { preHandler: [app.authenticate] }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const target = req.params.userId;
    const accept = req.body?.accept === true;
    const g = await prisma.group.findUnique({ where: { id: req.params.id } });
    if (!g) return reply.code(404).send({ error: 'not found' });
    const admin = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: g.id, userId: sub } },
    });
    if (!admin || admin.role !== 'admin') return reply.code(403).send({ error: 'admin only' });

    const jr = await prisma.groupJoinRequest.findUnique({
      where: { groupId_userId: { groupId: g.id, userId: target } },
    });
    if (!jr || jr.status !== 'pending') return reply.code(404).send({ error: 'no pending request' });

    if (accept) {
      await prisma.$transaction([
        prisma.groupMember.create({
          data: { groupId: g.id, userId: target, role: 'member' },
        }),
        prisma.groupJoinRequest.delete({
          where: { groupId_userId: { groupId: g.id, userId: target } },
        }),
      ]);
      await notifyUser(target, 'Request approved', `You were approved to join ${g.name}`, {
        kind: 'group_request_approved',
        groupId: g.id,
      });
      return { ok: true, status: 'approved' as const };
    }

    await prisma.groupJoinRequest.update({
      where: { groupId_userId: { groupId: g.id, userId: target } },
      data: { status: 'rejected' },
    });
    await notifyUser(target, 'Request declined', `Your request to join ${g.name} was declined`, {
      kind: 'group_request_rejected',
      groupId: g.id,
    });
    return { ok: true, status: 'rejected' as const };
  });

  app.post<{ Params: { id: string; userId: string } }>(
    `${P}/groups/:id/block/:userId`,
    { preHandler: [app.authenticate] },
    async (req, reply) => {
      const { sub } = req.user as { sub: string };
      const target = req.params.userId;
      const g = await prisma.group.findUnique({ where: { id: req.params.id } });
      if (!g) return reply.code(404).send({ error: 'not found' });
      const admin = await prisma.groupMember.findUnique({
        where: { groupId_userId: { groupId: g.id, userId: sub } },
      });
      if (!admin || admin.role !== 'admin') return reply.code(403).send({ error: 'admin only' });
      if (target === g.createdById) return reply.code(400).send({ error: 'cannot block owner' });
      if (target === sub) return reply.code(400).send({ error: 'cannot block yourself' });

      await prisma.groupMember.deleteMany({ where: { groupId: g.id, userId: target } });
      await prisma.groupJoinRequest.deleteMany({ where: { groupId: g.id, userId: target } });
      await prisma.groupBlockedUser.upsert({
        where: { groupId_userId: { groupId: g.id, userId: target } },
        create: { groupId: g.id, userId: target },
        update: {},
      });

      await notifyUser(target, 'Removed from group', `You were blocked from ${g.name}`, {
        kind: 'group_blocked',
        groupId: g.id,
      });
      return { ok: true };
    }
  );

  app.post<{ Params: { id: string } }>(`${P}/groups/:id/leave`, { preHandler: [app.authenticate] }, async (req) => {
    const { sub } = req.user as { sub: string };
    const g = await prisma.group.findUnique({ where: { id: req.params.id } });
    await prisma.groupMember.deleteMany({
      where: { groupId: req.params.id, userId: sub },
    });
    await prisma.groupJoinRequest.deleteMany({
      where: { groupId: req.params.id, userId: sub },
    });
    if (g) {
      await notifyGroupAdmins(
        g.id,
        'Member left',
        `Someone left ${g.name}`,
        { kind: 'group_leave', groupId: g.id, userId: sub },
        sub
      );
    }
    return { ok: true };
  });

  app.get<{ Params: { id: string } }>(`${P}/groups/:id/me`, { preHandler: [app.authenticate] }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const m = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: req.params.id, userId: sub } },
    });
    if (!m) return reply.code(404).send({ error: 'not a member' });
    return { role: m.role };
  });

  app.get<{ Params: { id: string } }>(`${P}/groups/:id/members`, { preHandler: [app.authenticate] }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const g = await prisma.group.findUnique({ where: { id: req.params.id } });
    if (!g) return reply.code(404).send({ error: 'not found' });
    const mem = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: g.id, userId: sub } },
    });
    if (!mem) return reply.code(403).send({ error: 'members only' });
    const rows = await prisma.groupMember.findMany({
      where: { groupId: g.id },
      orderBy: { joinedAt: 'asc' },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    return {
      members: rows.map((r) => ({
        userId: r.userId,
        name: r.user.name,
        email: r.user.email,
        role: r.role,
        joinedAt: r.joinedAt,
      })),
    };
  });

  app.delete<{ Params: { id: string; userId: string } }>(
    `${P}/groups/:id/members/:userId`,
    { preHandler: [app.authenticate] },
    async (req, reply) => {
      const { sub } = req.user as { sub: string };
      const target = req.params.userId;
      const g = await prisma.group.findUnique({ where: { id: req.params.id } });
      if (!g) return reply.code(404).send({ error: 'not found' });
      const admin = await prisma.groupMember.findUnique({
        where: { groupId_userId: { groupId: g.id, userId: sub } },
      });
      if (!admin || admin.role !== 'admin') {
        return reply.code(403).send({ error: 'admin only' });
      }
      if (target === g.createdById) {
        return reply.code(400).send({ error: 'cannot remove owner' });
      }
      await prisma.groupMember.deleteMany({
        where: { groupId: g.id, userId: target },
      });
      await notifyUser(target, 'Removed from group', `You were removed from ${g.name}`, {
        kind: 'group_removed',
        groupId: g.id,
      });
      return { ok: true };
    }
  );

  app.get<{ Params: { id: string } }>(`${P}/groups/:id/chat`, { preHandler: [app.authenticate] }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const g = await prisma.group.findUnique({ where: { id: req.params.id } });
    if (!g) return reply.code(404).send({ error: 'not found' });
    const m = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: g.id, userId: sub } },
    });
    if (!m) return reply.code(403).send({ error: 'not a member' });
    const rows = await prisma.groupMessage.findMany({
      where: { groupId: g.id },
      orderBy: { createdAt: 'desc' },
      take: 150,
      include: { user: { select: { id: true, name: true } } },
    });
    const messages = rows.reverse().map((x) => ({
      id: x.id,
      body: x.body,
      createdAt: x.createdAt,
      user: x.user,
    }));
    return { messages };
  });

  app.post<{
    Params: { id: string };
    Body: { body?: string };
  }>(`${P}/groups/:id/chat`, { preHandler: [app.authenticate] }, async (req, reply) => {
    const text = String(req.body?.body || '').trim();
    if (text.length < 1 || text.length > 8000) {
      return reply.code(400).send({ error: 'invalid body' });
    }
    const { sub } = req.user as { sub: string };
    const g = await prisma.group.findUnique({ where: { id: req.params.id } });
    if (!g) return reply.code(404).send({ error: 'not found' });
    const m = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: g.id, userId: sub } },
    });
    if (!m) return reply.code(403).send({ error: 'not a member' });
    const msg = await prisma.groupMessage.create({
      data: { groupId: g.id, userId: sub, body: text },
      include: { user: { select: { id: true, name: true } } },
    });

    const others = await prisma.groupMember.findMany({
      where: { groupId: g.id, userId: { not: sub } },
      take: 35,
      select: { userId: true },
    });
    const preview = text.length > 100 ? `${text.slice(0, 100)}…` : text;
    for (const o of others) {
      await notifyUser(o.userId, `New message in ${g.name}`, `${msg.user.name}: ${preview}`, {
        kind: 'group_chat',
        groupId: g.id,
      });
    }

    return {
      message: {
        id: msg.id,
        body: msg.body,
        createdAt: msg.createdAt,
        user: msg.user,
      },
    };
  });
}
