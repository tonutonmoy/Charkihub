import type { FastifyInstance } from 'fastify';
import { prisma } from '../db.js';
import { sortedUserPair } from '../lib/userPair.js';
import { notifyUser } from '../lib/notify.js';

const P = '/api/v1';

export function registerMessageRoutes(app: FastifyInstance) {
  app.get(`${P}/messages/conversations`, { preHandler: [app.authenticate] }, async (req) => {
    const { sub } = req.user as { sub: string };
    const convs = await prisma.conversation.findMany({
      where: { OR: [{ userLowId: sub }, { userHighId: sub }] },
      include: {
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        userLow: { select: { id: true, name: true } },
        userHigh: { select: { id: true, name: true } },
      },
    });

    const list = convs.map((c) => {
      const other = c.userLowId === sub ? c.userHigh : c.userLow;
      const last = c.messages[0];
      return {
        id: c.id,
        otherUser: other,
        lastMessage: last ? { body: last.body, createdAt: last.createdAt, read: last.read } : null,
      };
    });
    return { conversations: list };
  });

  app.post<{
    Body: { otherUserId?: string };
  }>(`${P}/messages/conversations`, { preHandler: [app.authenticate] }, async (req, reply) => {
    const other = String(req.body?.otherUserId || '');
    const { sub } = req.user as { sub: string };
    if (!other || other === sub) return reply.code(400).send({ error: 'invalid' });
    const u = await prisma.user.findUnique({ where: { id: other } });
    if (!u) return reply.code(404).send({ error: 'not found' });
    const [low, high] = sortedUserPair(sub, other);
    const conv = await prisma.conversation.upsert({
      where: { userLowId_userHighId: { userLowId: low, userHighId: high } },
      create: { userLowId: low, userHighId: high },
      update: {},
    });
    return { conversationId: conv.id };
  });

  app.get<{ Params: { id: string } }>(
    `${P}/messages/conversations/:id`,
    { preHandler: [app.authenticate] },
    async (req, reply) => {
      const { sub } = req.user as { sub: string };
      const conv = await prisma.conversation.findUnique({ where: { id: req.params.id } });
      if (!conv || (conv.userLowId !== sub && conv.userHighId !== sub)) {
        return reply.code(404).send({ error: 'not found' });
      }
      const messages = await prisma.message.findMany({
        where: { conversationId: conv.id },
        orderBy: { createdAt: 'asc' },
        take: 200,
        include: { sender: { select: { id: true, name: true } } },
      });
      await prisma.message.updateMany({
        where: { conversationId: conv.id, senderId: { not: sub }, read: false },
        data: { read: true },
      });
      return {
        messages: messages.map((m) => ({
          id: m.id,
          body: m.body,
          read: m.read,
          createdAt: m.createdAt,
          sender: m.sender,
        })),
      };
    }
  );

  app.post<{
    Params: { id: string };
    Body: { body?: string };
  }>(`${P}/messages/conversations/:id/messages`, { preHandler: [app.authenticate] }, async (req, reply) => {
    const text = String(req.body?.body || '').trim();
    if (text.length < 1 || text.length > 8000) {
      return reply.code(400).send({ error: 'invalid body' });
    }
    const { sub } = req.user as { sub: string };
    const conv = await prisma.conversation.findUnique({ where: { id: req.params.id } });
    if (!conv || (conv.userLowId !== sub && conv.userHighId !== sub)) {
      return reply.code(404).send({ error: 'not found' });
    }
    const other = conv.userLowId === sub ? conv.userHighId : conv.userLowId;
    const m = await prisma.message.create({
      data: {
        conversationId: conv.id,
        senderId: sub,
        body: text,
      },
      include: { sender: { select: { id: true, name: true } } },
    });
    const me = await prisma.user.findUnique({ where: { id: sub } });
    await notifyUser(other, 'New message', `${me?.name ?? 'Someone'}: ${text.slice(0, 120)}`, {
      kind: 'dm',
      conversationId: conv.id,
      messageId: m.id,
    });
    return {
      message: {
        id: m.id,
        body: m.body,
        read: m.read,
        createdAt: m.createdAt,
        sender: m.sender,
      },
    };
  });
}
