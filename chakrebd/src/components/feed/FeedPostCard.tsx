'use client';

import React from 'react';
import DOMPurify from 'dompurify';
import { motion } from 'motion/react';
import { MessageCircle, Share2, ThumbsUp, Globe, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CommentThread } from '@/src/components/CommentThread';
import type { ApiFeedPost, ApiCommentNode } from '@/lib/api';
import { cn } from '@/lib/utils';

const EMOJIS = ['👍', '❤️', '😂', '😮', '🙏'];

type Props = {
  post: ApiFeedPost;
  highlight?: boolean;
  comments: ApiCommentNode[];
  commentDraft: string;
  onCommentDraft: (v: string) => void;
  onSendComment: () => void;
  onRefreshComments: () => void;
  onReact: (emoji: string) => void;
  onShare: () => void;
  isLoggedIn: boolean;
  onLogin: () => void;
};

function ImageGrid({ urls }: { urls: string[] }) {
  const n = urls.length;
  if (n === 0) return null;
  if (n === 1) {
    return (
      <div className="mt-3 -mx-0">
        <img src={urls[0]} alt="" className="w-full max-h-[420px] object-cover bg-muted" />
      </div>
    );
  }
  if (n === 2) {
    return (
      <div className="mt-3 grid grid-cols-2 gap-0.5 bg-border">
        {urls.map((u) => (
          <img key={u} src={u} alt="" className="w-full h-52 object-cover bg-muted" />
        ))}
      </div>
    );
  }
  if (n === 3) {
    return (
      <div className="mt-3 grid grid-cols-2 gap-0.5 bg-border">
        <img src={urls[0]} alt="" className="w-full h-64 object-cover bg-muted row-span-2" />
        <img src={urls[1]} alt="" className="w-full h-[calc(8rem-2px)] object-cover bg-muted" />
        <img src={urls[2]} alt="" className="w-full h-[calc(8rem-2px)] object-cover bg-muted" />
      </div>
    );
  }
  return (
    <div className="mt-3 grid grid-cols-2 gap-0.5 bg-border">
      {urls.slice(0, 4).map((u, i) => (
        <div key={u} className="relative">
          <img src={u} alt="" className="w-full h-48 object-cover bg-muted" />
          {i === 3 && n > 4 ? (
            <div className="absolute inset-0 bg-black/55 flex items-center justify-center text-white text-2xl font-black">
              +{n - 4}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function FeedPostCard({
  post: p,
  highlight,
  comments,
  commentDraft,
  onCommentDraft,
  onSendComment,
  onRefreshComments,
  onReact,
  onShare,
  isLoggedIn,
  onLogin,
}: Props) {
  const safeHtml =
    p.bodyHtml && p.bodyHtml.trim()
      ? DOMPurify.sanitize(p.bodyHtml, { USE_PROFILES: { html: true } })
      : '';
  const urls = p.images?.map((i) => i.url) || [];
  const reactions = p.reactions ?? [];
  const totalReactions = reactions.reduce((a, x) => a + x.count, 0);

  return (
    <motion.div
      id={`post-${p.id}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-xl bg-card shadow-[0_1px_2px_rgba(0,0,0,0.08)] dark:shadow-none border overflow-hidden',
        highlight ? 'ring-2 ring-primary border-primary/30' : 'border-border/60'
      )}
    >
      <div className="p-4 pb-2">
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-primary/5 flex items-center justify-center text-sm font-black text-primary shrink-0">
            {p.user.name.slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-[15px] leading-tight">{p.user.name}</p>
            <div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground mt-0.5">
              <span>{new Date(p.createdAt).toLocaleString()}</span>
              <span>·</span>
              {p.group ? (
                <span className="inline-flex items-center gap-0.5 font-medium text-foreground/80">
                  <Users className="w-3 h-3" /> {p.group.name}
                </span>
              ) : (
                <span className="inline-flex items-center gap-0.5">
                  <Globe className="w-3 h-3" /> Public
                </span>
              )}
            </div>
          </div>
        </div>

        {safeHtml ? (
          <div
            className="mt-3 text-[15px] leading-relaxed prose prose-sm dark:prose-invert max-w-none [&_a]:text-primary"
            dangerouslySetInnerHTML={{ __html: safeHtml }}
          />
        ) : p.body ? (
          <p className="mt-3 text-[15px] leading-relaxed whitespace-pre-wrap">{p.body}</p>
        ) : null}

        <ImageGrid urls={urls} />

        {totalReactions > 0 || p.shareCount > 0 ? (
          <div className="flex justify-between items-center mt-3 pt-2 text-xs text-muted-foreground border-t border-border/40">
            <span>
              {totalReactions > 0 ? (
                <span className="inline-flex items-center gap-1">
                  <ThumbsUp className="w-3.5 h-3.5 text-primary" /> {totalReactions}
                </span>
              ) : (
                <span />
              )}
            </span>
            <span>
              {p.shareCount > 0 ? `${p.shareCount} share${p.shareCount === 1 ? '' : 's'}` : ''}
            </span>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-1 py-2 border-t border-border/50 mt-2">
          {EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              className={cn(
                'px-2 py-1 rounded-full text-base transition-colors',
                p.myReaction === e ? 'bg-primary/15 ring-1 ring-primary/40' : 'hover:bg-muted/80'
              )}
              onClick={() => (isLoggedIn ? onReact(e) : onLogin())}
            >
              {e}
              {(reactions.find((x) => x.emoji === e)?.count ?? 0) > 0
                ? ` ${reactions.find((x) => x.emoji === e)?.count}`
                : ''}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 border-t border-border/50 -mx-4 px-2">
          <Button
            type="button"
            variant="ghost"
            className="rounded-none h-11 font-semibold text-muted-foreground hover:bg-muted/60"
            onClick={() => (isLoggedIn ? onReact('👍') : onLogin())}
          >
            <ThumbsUp className="w-4 h-4 mr-2 opacity-80" /> Like
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="rounded-none h-11 font-semibold text-muted-foreground hover:bg-muted/60"
            onClick={() =>
              isLoggedIn ? document.getElementById(`comment-box-${p.id}`)?.focus() : onLogin()
            }
          >
            <MessageCircle className="w-4 h-4 mr-2" /> Comment
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="rounded-none h-11 font-semibold text-muted-foreground hover:bg-muted/60"
            onClick={onShare}
          >
            <Share2 className="w-4 h-4 mr-2" /> Share
          </Button>
        </div>
      </div>

      <div className="border-t border-border/50 bg-muted/20 px-4 py-3">
        <div className="flex gap-2 mb-3">
          <Input
            id={`comment-box-${p.id}`}
            placeholder={isLoggedIn ? 'Write a comment…' : 'Sign in to comment…'}
            className="rounded-full bg-background border-border/60"
            value={commentDraft}
            onChange={(e) => onCommentDraft(e.target.value)}
            readOnly={!isLoggedIn}
            onClick={() => {
              if (!isLoggedIn) onLogin();
            }}
          />
          <Button
            type="button"
            className="rounded-full shrink-0"
            onClick={() => (isLoggedIn ? onSendComment() : onLogin())}
          >
            Reply
          </Button>
        </div>
        <CommentThread
          targetType="feed"
          targetId={p.id}
          nodes={comments}
          isLoggedIn={isLoggedIn}
          onLogin={onLogin}
          onRefresh={onRefreshComments}
        />
      </div>
    </motion.div>
  );
}
