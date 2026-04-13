'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { postComment, setReaction, type ApiCommentNode } from '@/lib/api';

const EMOJIS = ['👍', '❤️', '😂', '😮', '🙏'];

export function CommentThread({
  targetType,
  targetId,
  nodes,
  depth = 0,
  isLoggedIn,
  onLogin,
  onRefresh,
}: {
  targetType: 'job' | 'blog' | 'feed';
  targetId: string;
  nodes: ApiCommentNode[];
  depth?: number;
  isLoggedIn: boolean;
  onLogin: () => void;
  onRefresh: () => void;
}) {
  const [reply, setReply] = useState<Record<string, string>>({});

  const react = async (commentId: string, emoji: string) => {
    if (!isLoggedIn) {
      onLogin();
      return;
    }
    await setReaction({ targetType: 'comment', targetId: commentId, emoji });
    onRefresh();
  };

  const sendReply = async (parentId: string) => {
    if (!isLoggedIn) {
      onLogin();
      return;
    }
    const t = (reply[parentId] || '').trim();
    if (!t) return;
    const r = await postComment(targetType, targetId, t, parentId);
    if (r.ok) {
      setReply((s) => ({ ...s, [parentId]: '' }));
      onRefresh();
    }
  };

  return (
    <ul className={depth ? 'mt-2 ml-4 border-l-2 border-border/60 pl-3 space-y-2' : 'space-y-3'}>
      {nodes.map((n) => (
        <li key={n.id} className="p-4 rounded-xl bg-muted/50 border border-border/50">
          <p className="text-xs font-bold text-muted-foreground">{n.user.name}</p>
          <p className="text-sm mt-1">{n.body}</p>
          <div className="flex flex-wrap gap-1 mt-2">
            {EMOJIS.map((e) => {
              const rx = n.reactions ?? [];
              const c = rx.find((x) => x.emoji === e)?.count ?? 0;
              return (
              <Button
                key={e}
                type="button"
                variant={n.myReaction === e ? 'default' : 'ghost'}
                size="sm"
                className="h-8 px-2 rounded-full text-base"
                onClick={() => react(n.id, e)}
              >
                {e}{' '}
                {c > 0 ? c : ''}
              </Button>
            );
            })}
          </div>
          {isLoggedIn ? (
            <div className="flex gap-2 mt-2 max-w-md">
              <Input
                placeholder="Reply…"
                className="h-9 text-xs rounded-lg"
                value={reply[n.id] || ''}
                onChange={(ev) => setReply((s) => ({ ...s, [n.id]: ev.target.value }))}
              />
              <Button type="button" size="sm" className="h-9 rounded-lg" onClick={() => sendReply(n.id)}>
                Reply
              </Button>
            </div>
          ) : null}
          {n.replies?.length ? (
            <CommentThread
              targetType={targetType}
              targetId={targetId}
              nodes={n.replies}
              depth={depth + 1}
              isLoggedIn={isLoggedIn}
              onLogin={onLogin}
              onRefresh={onRefresh}
            />
          ) : null}
        </li>
      ))}
    </ul>
  );
}
