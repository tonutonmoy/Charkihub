'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/components/AuthContext';
import { listNotifications, markNotificationRead, markAllNotificationsRead, type ApiNotification } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function NotificationsPage() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const [rows, setRows] = useState<ApiNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    listNotifications().then((r) => {
      if (r.ok) setRows(r.notifications);
      setLoading(false);
    });
  };

  useEffect(() => {
    if (!isLoggedIn) return;
    load();
  }, [isLoggedIn]);

  if (!isLoggedIn) return <p className="text-muted-foreground">Please sign in.</p>;
  if (loading) return <p className="text-muted-foreground">Loading…</p>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-4 flex-wrap">
        <h1 className="text-3xl font-black">Notifications</h1>
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl"
          onClick={async () => {
            await markAllNotificationsRead();
            load();
          }}
        >
          Mark all read
        </Button>
      </div>
      <div className="space-y-3">
        {rows.length === 0 ? (
          <p className="text-muted-foreground">No notifications yet.</p>
        ) : (
          rows.map((n) => (
            <Card
              key={n.id}
              className={`rounded-2xl ${!n.read ? 'border-primary/40' : ''} cursor-pointer hover:bg-muted/30 transition-colors`}
              onClick={async () => {
                await markNotificationRead(n.id);
                const meta = n.meta as Record<string, string> | null | undefined;
                const kind = meta?.kind;
                if (kind === 'feed_comment' || kind === 'reaction_feed') {
                  const postId = meta?.postId;
                  if (postId) router.push(`/community?post=${encodeURIComponent(postId)}`);
                  return;
                }
                if (kind === 'reaction_comment' || kind === 'comment_reply') {
                  const tt = meta?.targetType;
                  const tid = meta?.targetId;
                  if (tt === 'feed' && tid) router.push(`/community?post=${encodeURIComponent(tid)}`);
                  if (tt === 'job' && tid) router.push(`/jobs/${encodeURIComponent(tid)}`);
                  return;
                }
                if (kind === 'dm' && meta?.conversationId) {
                  router.push(`/dashboard/messages?c=${encodeURIComponent(meta.conversationId)}`);
                  return;
                }
                if (
                  kind &&
                  typeof kind === 'string' &&
                  kind.startsWith('group') &&
                  meta &&
                  typeof meta === 'object' &&
                  'groupId' in meta &&
                  typeof (meta as { groupId?: string }).groupId === 'string'
                ) {
                  router.push(`/community/groups/${encodeURIComponent((meta as { groupId: string }).groupId)}`);
                  return;
                }
                load();
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && (e.currentTarget as HTMLElement).click()}
            >
              <CardContent className="p-8 flex justify-between gap-4">
                <div>
                  <p className="font-bold">{n.title}</p>
                  <p className="text-sm text-muted-foreground mt-1">{n.body}</p>
                  <p className="text-xs text-muted-foreground mt-2">{new Date(n.createdAt).toLocaleString()}</p>
                </div>
                {!n.read ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="shrink-0 rounded-xl"
                    onClick={async (e) => {
                      e.stopPropagation();
                      await markNotificationRead(n.id);
                      load();
                    }}
                  >
                    Mark read
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
