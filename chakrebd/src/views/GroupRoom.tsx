'use client';

import React, { useCallback, useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import { ArrowLeft, Loader2, MessageSquare, Shield, Users, UserX, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/src/components/ConfirmDialog';
import { LoginRequiredDialog } from '@/src/components/LoginRequiredDialog';
import { useAuth } from '@/src/components/AuthContext';
import { FacebookComposer } from '@/src/components/feed/FacebookComposer';
import { FeedPostCard } from '@/src/components/feed/FeedPostCard';
import {
  createFeedPost,
  fetchFeed,
  getGroup,
  getGroupChat,
  getGroupMyStatus,
  joinGroup,
  leaveGroup,
  listComments,
  listGroupMembers,
  listGroupJoinRequests,
  respondGroupJoinRequest,
  blockGroupUser,
  postComment,
  removeGroupMember,
  sendGroupChatMessage,
  setReaction,
  shareFeedPost,
  type ApiFeedPost,
  type ApiCommentNode,
  type ApiGroupDetail,
} from '@/lib/api';

export default function GroupRoom() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id || '');
  const { isLoggedIn, user } = useAuth();

  const [group, setGroup] = useState<ApiGroupDetail | null>(null);
  const [myStatus, setMyStatus] = useState<
    'loading' | 'blocked' | 'none' | 'pending' | 'member'
  >('loading');
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<ApiFeedPost[]>([]);
  const [feedLoading, setFeedLoading] = useState(false);
  const [commentsByPost, setCommentsByPost] = useState<Record<string, ApiCommentNode[]>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  const [chat, setChat] = useState<
    { id: string; body: string; createdAt: string; user: { id: string; name: string } }[]
  >([]);
  const [chatDraft, setChatDraft] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  const [members, setMembers] = useState<
    { userId: string; name: string; email: string; role: string; joinedAt: string }[]
  >([]);

  const [joinRequests, setJoinRequests] = useState<
    { id: string; userId: string; name: string; email: string; createdAt: string }[]
  >([]);

  const [loginPromptOpen, setLoginPromptOpen] = useState(false);
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
  const [blockConfirm, setBlockConfirm] = useState<{ userId: string; name: string } | null>(null);

  const loadGroup = useCallback(() => {
    if (!id) return;
    getGroup(id).then((r) => {
      setGroup(r.ok ? r.group : null);
      setLoading(false);
    });
  }, [id]);

  const loadMyStatus = useCallback(() => {
    if (!id || !isLoggedIn) {
      setMyStatus('none');
      setRole(null);
      return;
    }
    getGroupMyStatus(id).then((r) => {
      if (!r.ok) {
        setMyStatus('none');
        setRole(null);
        return;
      }
      const d = r.data;
      if (d.blocked) {
        setMyStatus('blocked');
        setRole(null);
        return;
      }
      if (d.status === 'member') {
        setMyStatus('member');
        setRole(d.role);
        return;
      }
      if (d.status === 'pending') {
        setMyStatus('pending');
        setRole(null);
        return;
      }
      setMyStatus('none');
      setRole(null);
    });
  }, [id, isLoggedIn]);

  const loadFeed = useCallback(() => {
    if (!id || myStatus !== 'member') return;
    setFeedLoading(true);
    fetchFeed({ page: 1, groupId: id }).then((r) => {
      if (r.ok) setPosts(r.posts);
      setFeedLoading(false);
    });
  }, [id, myStatus]);

  const loadComments = async (postId: string) => {
    const r = await listComments('feed', postId);
    if (r.ok) setCommentsByPost((s) => ({ ...s, [postId]: r.comments }));
  };

  const loadChat = useCallback(() => {
    if (!id || myStatus !== 'member') return;
    setChatLoading(true);
    getGroupChat(id).then((r) => {
      if (r.ok) setChat(r.messages);
      setChatLoading(false);
    });
  }, [id, myStatus]);

  const loadMembers = useCallback(() => {
    if (!id || myStatus !== 'member') return;
    listGroupMembers(id).then((r) => {
      if (r.ok) setMembers(r.members);
    });
  }, [id, myStatus]);

  const loadJoinRequests = useCallback(() => {
    if (!id || role !== 'admin') return;
    listGroupJoinRequests(id).then((r) => {
      if (r.ok) setJoinRequests(r.requests);
    });
  }, [id, role]);

  useEffect(() => {
    loadGroup();
  }, [loadGroup]);

  useEffect(() => {
    loadMyStatus();
  }, [loadMyStatus]);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  useEffect(() => {
    for (const p of posts) {
      void loadComments(p.id);
    }
  }, [posts]);

  useEffect(() => {
    loadChat();
    const t = setInterval(() => loadChat(), 12000);
    return () => clearInterval(t);
  }, [loadChat]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  useEffect(() => {
    loadJoinRequests();
  }, [loadJoinRequests]);

  const onJoin = async () => {
    if (!isLoggedIn) {
      setLoginPromptOpen(true);
      return;
    }
    const r = await joinGroup(id);
    if (r.ok) {
      if (r.status === 'pending') {
        toast.success('Request sent', {
          description: 'Admins will approve or decline your request.',
        });
      } else {
        toast.success('Joined group');
      }
      loadMyStatus();
    } else {
      toast.error(r.error || 'Could not join');
    }
  };

  const onLeave = async () => {
    const r = await leaveGroup(id);
    if (r.ok) {
      toast.success('You left the group');
      loadMyStatus();
      setPosts([]);
    } else {
      toast.error(r.error || 'Could not leave');
    }
  };

  const sendChat = async () => {
    const t = chatDraft.trim();
    if (!t || !id) return;
    const r = await sendGroupChatMessage(id, t);
    if (r.ok) {
      setChatDraft('');
      loadChat();
    }
  };

  const isMember = myStatus === 'member';
  const isAdmin = role === 'admin';

  const [activeTab, setActiveTab] = useState('discussion');
  const tabDefs = useMemo(() => {
    const rows: { value: string; label: string; Icon: LucideIcon | null }[] = [
      { value: 'discussion', label: 'Discussion', Icon: null },
      { value: 'chat', label: 'Group chat', Icon: MessageSquare },
      { value: 'members', label: 'Members', Icon: Users },
    ];
    if (isAdmin) rows.push({ value: 'requests', label: 'Requests', Icon: Shield });
    return rows;
  }, [isAdmin]);

  useEffect(() => {
    if (!isMember && (activeTab === 'chat' || activeTab === 'members')) setActiveTab('discussion');
  }, [isMember, activeTab]);

  useEffect(() => {
    if (!isAdmin && activeTab === 'requests') setActiveTab('discussion');
  }, [isAdmin, activeTab]);

  if (loading) {
    return (
      <div className="pt-28 pb-16 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="pt-28 pb-16 container mx-auto px-4 text-center">
        <p className="text-muted-foreground">Group not found.</p>
        <Link
          href="/community?tab=groups"
          className="inline-flex items-center justify-center mt-4 rounded-full h-10 px-6 bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90"
        >
          Back to community
        </Link>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-16 min-h-screen bg-muted/30">
      <LoginRequiredDialog open={loginPromptOpen} onOpenChange={setLoginPromptOpen} />
      <ConfirmDialog
        open={leaveConfirmOpen}
        onOpenChange={setLeaveConfirmOpen}
        title="Leave this group?"
        description="You will lose access to posts and chat until you join again."
        confirmLabel="Leave"
        variant="destructive"
        onConfirm={() => void onLeave()}
      />
      <ConfirmDialog
        open={!!blockConfirm}
        onOpenChange={(o) => !o && setBlockConfirm(null)}
        title={`Block ${blockConfirm?.name ?? ''}?`}
        description="They will be removed and cannot rejoin unless unblocked."
        confirmLabel="Block"
        variant="destructive"
        onConfirm={async () => {
          if (!blockConfirm) return;
          await blockGroupUser(id, blockConfirm.userId);
          loadMembers();
          loadMyStatus();
        }}
      />

      <div
        className="h-40 md:h-52 bg-gradient-to-r from-primary/40 via-primary/20 to-muted border-b border-border/50 relative"
        style={
          group.coverUrl
            ? { backgroundImage: `url(${group.coverUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
            : undefined
        }
      >
        <div className="container mx-auto px-4 max-w-4xl h-full flex items-end pb-4">
          <Link
            href="/community?tab=groups"
            className="absolute top-4 left-4 inline-flex items-center gap-2 text-sm font-semibold text-foreground/90 bg-background/80 backdrop-blur px-3 py-1.5 rounded-full"
          >
            <ArrowLeft className="w-4 h-4" /> Back to groups
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-6xl -mt-6 relative z-10">
        <div className="rounded-xl bg-card border border-border/60 shadow-sm p-4 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight">{group.name}</h1>
              <p className="text-xs font-bold text-primary mt-1">{group.isPublic ? 'Public group' : 'Private group'}</p>
              <p className="text-muted-foreground text-sm mt-1">
                {group.memberCount} members · {group.postCount} posts
              </p>
              {group.description ? (
                <p className="text-sm mt-3 leading-relaxed text-foreground/90">{group.description}</p>
              ) : null}
            </div>
            <div className="flex flex-col items-end gap-2">
              {myStatus === 'blocked' ? (
                <p className="text-sm font-semibold text-destructive">You are blocked from this group.</p>
              ) : null}
              {myStatus === 'pending' ? (
                <span className="text-sm font-semibold text-amber-600">Request pending — wait for admin</span>
              ) : null}
              {!isLoggedIn ? (
                <Button className="rounded-full font-bold px-6" onClick={() => setLoginPromptOpen(true)}>
                  Sign in to join
                </Button>
              ) : null}
              {isLoggedIn && myStatus === 'none' ? (
                <Button className="rounded-full font-bold px-6" onClick={() => void onJoin()}>
                  {group.isPublic ? 'Join group' : 'Request to join'}
                </Button>
              ) : null}
              {isMember ? (
                <div className="flex flex-wrap gap-2 justify-end">
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
                    <Shield className="w-4 h-4" /> {isAdmin ? 'Admin' : 'Member'}
                  </span>
                  <Button variant="outline" size="sm" className="rounded-full" onClick={() => setLeaveConfirmOpen(true)}>
                    <LogOut className="w-4 h-4 mr-1" /> Leave
                  </Button>
                </div>
              ) : null}
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
            <div className="flex flex-col lg:flex-row lg:items-start gap-6">
              <aside className="lg:w-56 shrink-0 lg:sticky lg:top-24 space-y-2">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1 hidden lg:block">
                  Group
                </p>
                <TabsList className="flex w-full h-auto flex-wrap gap-1 p-1.5 bg-muted/50 rounded-xl lg:flex-col lg:items-stretch lg:p-2 lg:gap-1 overflow-x-auto no-scrollbar">
                  {tabDefs.map(({ value, label, Icon }) => (
                    <TabsTrigger
                      key={value}
                      value={value}
                      disabled={
                        (value === 'chat' || value === 'members') && !isMember
                      }
                      className="rounded-lg flex-1 min-w-[92px] sm:min-w-[100px] justify-center lg:flex-none lg:w-full lg:justify-start lg:min-w-0 lg:px-3 lg:py-2.5 data-[state=active]:shadow-sm font-semibold text-sm"
                    >
                      <span className="inline-flex items-center gap-2">
                        {Icon ? <Icon className="w-4 h-4 shrink-0 opacity-80" /> : null}
                        <span className="truncate">{label}</span>
                      </span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </aside>

              <div className="min-w-0 flex-1 space-y-6">
            <TabsContent value="discussion" className="mt-0 space-y-6 focus-visible:outline-none">
              {!isMember ? (
                <p className="text-sm text-muted-foreground text-center py-6 rounded-xl border border-dashed">
                  {myStatus === 'pending'
                    ? 'When an admin approves your request, you can post and see discussion.'
                    : myStatus === 'blocked'
                      ? 'You cannot view this group’s discussion.'
                      : 'Join the group to see and post in the discussion.'}
                </p>
              ) : null}

              {isMember && isLoggedIn ? (
                <FacebookComposer
                  placeholder={`Write something in ${group.name}…`}
                  onSubmit={async ({ body, bodyHtml, imageUrls }) => {
                    const r = await createFeedPost({ body, bodyHtml, imageUrls, groupId: id });
                    if (r.ok) loadFeed();
                  }}
                />
              ) : null}

              {!isMember ? null : feedLoading ? (
                <p className="text-center text-muted-foreground py-8">Loading posts…</p>
              ) : (
                <div className="space-y-4">
                  {posts.map((p) => (
                    <FeedPostCard
                      key={p.id}
                      post={p}
                      comments={commentsByPost[p.id] || []}
                      commentDraft={commentInputs[p.id] || ''}
                      onCommentDraft={(v) => setCommentInputs((s) => ({ ...s, [p.id]: v }))}
                      onSendComment={async () => {
                        if (!isLoggedIn) {
                          setLoginPromptOpen(true);
                          return;
                        }
                        const t = (commentInputs[p.id] || '').trim();
                        if (!t) return;
                        const r = await postComment('feed', p.id, t);
                        if (r.ok) {
                          setCommentInputs((s) => ({ ...s, [p.id]: '' }));
                          await loadComments(p.id);
                        }
                      }}
                      onRefreshComments={() => loadComments(p.id)}
                      onReact={async (emoji) => {
                        if (!isLoggedIn) {
                          setLoginPromptOpen(true);
                          return;
                        }
                        await setReaction({ targetType: 'feed_post', targetId: p.id, emoji });
                        loadFeed();
                      }}
                      onShare={async () => {
                        await shareFeedPost(p.id);
                        loadFeed();
                      }}
                      isLoggedIn={!!isLoggedIn}
                      onLogin={() => setLoginPromptOpen(true)}
                    />
                  ))}
                  {posts.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No posts in this group yet.</p>
                  ) : null}
                </div>
              )}
            </TabsContent>

            <TabsContent value="chat" className="mt-0 focus-visible:outline-none">
              {!isMember ? null : (
                <div className="rounded-xl border border-border/60 bg-card overflow-hidden flex flex-col min-h-[420px]">
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50 bg-muted/30">
                    <MessageSquare className="w-5 h-5 text-primary" />
                    <span className="font-bold">Group chat</span>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[360px] bg-muted/10">
                    {chatLoading ? (
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                    ) : (
                      chat.map((m) => (
                        <div
                          key={m.id}
                          className={`flex ${m.user.id === user?.id ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                              m.user.id === user?.id ? 'bg-primary text-primary-foreground' : 'bg-muted'
                            }`}
                          >
                            <p className="text-xs font-bold opacity-80 mb-0.5">{m.user.name}</p>
                            {m.body}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="p-3 border-t border-border/50 flex gap-2">
                    <Input
                      className="rounded-full"
                      placeholder="Message the group…"
                      value={chatDraft}
                      onChange={(e) => setChatDraft(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && void sendChat()}
                    />
                    <Button className="rounded-full" onClick={() => void sendChat()}>
                      Send
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="members" className="mt-0 space-y-3 focus-visible:outline-none">
              {!isMember ? null : (
                <>
                  {members.map((m) => (
                    <div
                      key={m.userId}
                      className="flex flex-wrap items-center justify-between gap-2 p-4 rounded-xl border border-border/50 bg-card"
                    >
                      <div>
                        <p className="font-bold">{m.name}</p>
                        <p className="text-xs text-muted-foreground">{m.email}</p>
                        <p className="text-xs text-primary mt-1">{m.role}</p>
                      </div>
                      {isAdmin && m.role !== 'admin' && m.userId !== group.createdBy.id ? (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-lg"
                            onClick={async () => {
                              await removeGroupMember(id, m.userId);
                              loadMembers();
                            }}
                          >
                            Remove
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="rounded-lg"
                            onClick={() => setBlockConfirm({ userId: m.userId, name: m.name })}
                          >
                            <UserX className="w-4 h-4 mr-1" /> Block
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  ))}
                  {members.length === 0 ? (
                    <p className="text-muted-foreground flex items-center gap-2">
                      <Users className="w-4 h-4" /> No members loaded.
                    </p>
                  ) : null}
                </>
              )}
            </TabsContent>

            {isAdmin ? (
              <TabsContent value="requests" className="mt-0 space-y-3 focus-visible:outline-none">
                {joinRequests.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No pending join requests.</p>
                ) : null}
                {joinRequests.map((jr) => (
                  <div
                    key={jr.id}
                    className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border border-border/50 bg-card"
                  >
                    <div>
                      <p className="font-bold">{jr.name}</p>
                      <p className="text-xs text-muted-foreground">{jr.email}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="rounded-lg"
                        onClick={async () => {
                          await respondGroupJoinRequest(id, jr.userId, true);
                          loadJoinRequests();
                          loadMembers();
                        }}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-lg"
                        onClick={async () => {
                          await respondGroupJoinRequest(id, jr.userId, false);
                          loadJoinRequests();
                        }}
                      >
                        Decline
                      </Button>
                    </div>
                  </div>
                ))}
              </TabsContent>
            ) : null}
              </div>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
