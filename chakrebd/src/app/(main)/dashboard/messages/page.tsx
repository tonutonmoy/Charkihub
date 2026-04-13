'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/src/components/AuthContext';
import { listConversations, getConversationMessages, sendDirectMessage } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Send, ChevronLeft } from 'lucide-react';

function MessagesInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cParam = searchParams.get('c');
  const { isLoggedIn, user } = useAuth();
  const [convs, setConvs] = useState<
    { id: string; otherUser: { id: string; name: string }; lastMessage: { body: string } | null }[]
  >([]);
  const [active, setActive] = useState<string | null>(cParam);
  const [q, setQ] = useState('');
  const [messages, setMessages] = useState<
    { id: string; body: string; createdAt: string; sender: { id: string; name: string } }[]
  >([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);

  const loadConvs = () => {
    listConversations().then((r) => {
      if (r.ok) setConvs(r.conversations);
      setLoading(false);
    });
  };

  useEffect(() => {
    if (!isLoggedIn) return;
    loadConvs();
  }, [isLoggedIn]);

  useEffect(() => {
    if (cParam) setActive(cParam);
  }, [cParam]);

  useEffect(() => {
    if (!active || !isLoggedIn) return;
    getConversationMessages(active).then((r) => {
      if (r.ok) setMessages(r.messages);
    });
  }, [active, isLoggedIn]);

  const send = async () => {
    const t = draft.trim();
    if (!t || !active) return;
    await sendDirectMessage(active, t);
    setDraft('');
    const r = await getConversationMessages(active);
    if (r.ok) setMessages(r.messages);
    loadConvs();
  };

  const filtered = convs.filter((c) => c.otherUser.name.toLowerCase().includes(q.toLowerCase()));

  const activeConv = convs.find((c) => c.id === active);

  if (!isLoggedIn) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-muted-foreground">
        Please sign in to use Messenger.
      </div>
    );
  }
  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-muted-foreground">
        Loading…
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] md:min-h-[560px] flex flex-col md:flex-row rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden -mx-2 md:mx-0">
      {/* Thread list — Messenger left rail */}
      <div
        className={`w-full md:w-[320px] shrink-0 border-b md:border-b-0 md:border-r border-border/60 flex flex-col bg-muted/20 min-h-[280px] md:min-h-0 ${
          active ? 'hidden md:flex' : 'flex'
        }`}
      >
        <div className="p-3 border-b border-border/50 bg-background/80">
          <h1 className="text-xl font-black px-1 mb-3">Messenger</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              className="pl-9 rounded-full bg-muted/50 border-0"
              placeholder="Search Messenger"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`w-full text-left px-3 py-3 flex items-center gap-3 transition-colors hover:bg-muted/60 ${
                active === c.id ? 'bg-primary/10 border-l-4 border-l-primary' : 'border-l-4 border-l-transparent'
              }`}
              onClick={() => {
                setActive(c.id);
                router.replace(`/dashboard/messages?c=${encodeURIComponent(c.id)}`, { scroll: false });
              }}
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500/30 to-blue-600/10 flex items-center justify-center text-sm font-black text-blue-800 dark:text-blue-200 shrink-0">
                {c.otherUser.name.slice(0, 1)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold truncate">{c.otherUser.name}</p>
                {c.lastMessage ? (
                  <p className="text-xs text-muted-foreground truncate">{c.lastMessage.body}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">Start chatting</p>
                )}
              </div>
            </button>
          ))}
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground p-4">No conversations match your search.</p>
          ) : null}
        </div>
      </div>

      {/* Chat pane */}
      <div className={`flex-1 flex flex-col min-h-[400px] bg-background ${!active ? 'hidden md:flex' : 'flex'}`}>
        {active && activeConv ? (
          <>
            <div className="flex items-center gap-2 px-3 py-2 border-b border-border/50 bg-muted/20 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden rounded-full"
                onClick={() => {
                  setActive(null);
                  router.replace('/dashboard/messages', { scroll: false });
                }}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/30 to-blue-600/10 flex items-center justify-center font-bold text-blue-800 dark:text-blue-200">
                {activeConv.otherUser.name.slice(0, 1)}
              </div>
              <div className="min-w-0">
                <p className="font-bold truncate">{activeConv.otherUser.name}</p>
                <p className="text-xs text-muted-foreground">Active now</p>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-[#f0f2f5] dark:bg-muted/30">
              {messages.map((m) => {
                const mine = m.sender.id === user?.id;
                return (
                  <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[78%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                        mine
                          ? 'bg-primary text-primary-foreground rounded-br-md'
                          : 'bg-card border border-border/50 rounded-bl-md'
                      }`}
                    >
                      {!mine ? (
                        <p className="text-[10px] font-bold opacity-70 mb-0.5">{m.sender.name}</p>
                      ) : null}
                      <p className="whitespace-pre-wrap break-words">{m.body}</p>
                      <p className={`text-[10px] mt-1 ${mine ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                        {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="p-3 border-t border-border/50 bg-background flex gap-2 shrink-0">
              <Input
                className="rounded-full flex-1 bg-muted/40 border-border/50"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Aa"
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && void send()}
              />
              <Button size="icon" className="rounded-full shrink-0" onClick={() => void send()} aria-label="Send">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </>
        ) : (
          <div className="flex-1 hidden md:flex flex-col items-center justify-center text-muted-foreground p-8">
            <div className="w-24 h-24 rounded-full bg-muted/50 flex items-center justify-center mb-4 text-4xl">
              💬
            </div>
            <p className="font-semibold text-foreground">Select a conversation</p>
            <p className="text-sm text-center mt-1">Your messages from Community will show up here.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<p className="text-muted-foreground py-12">Loading…</p>}>
      <MessagesInner />
    </Suspense>
  );
}
