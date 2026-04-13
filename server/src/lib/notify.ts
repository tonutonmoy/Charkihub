import { prisma } from '../db.js';

export async function notifyUser(
  userId: string,
  title: string,
  body: string,
  meta?: Record<string, unknown>
): Promise<void> {
  await prisma.notification.create({
    data: {
      userId,
      title: title.slice(0, 200),
      body: body.slice(0, 2000),
      meta: meta as object | undefined,
    },
  });
}
