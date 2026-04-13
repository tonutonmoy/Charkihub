'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Home,
  MessageCircle,
  Users,
  UsersRound,
  ChevronRight,
  Building2,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { LoginRequiredDialog } from '@/src/components/LoginRequiredDialog';
import { useAuth } from '@/src/components/AuthContext';
import { FacebookComposer } from '@/src/components/feed/FacebookComposer';
import { FeedPostCard } from '@/src/components/feed/FeedPostCard';
import {
  fetchFeed,
  createFeedPost,
  shareFeedPost,
  setReaction,
  listComments,
  postComment,
  listGroups,
  joinGroup,
  createGroup,
  searchUsers,
  followUser,
  requestConnection,
  listIncomingConnections,
  respondConnection,
  listConversations,
  openOrCreateConversation,
  listConnections,
  listMyGroups,
  type ApiFeedPost,
  type ApiCommentNode,
} from '@/lib/api';

const TABS = ['feed', 'people', 'groups', 'messages'] as const;
type Tab = (typeof TABS)[number];

function parseTab(s: string | null): Tab {
  if (s && TABS.includes(s as Tab)) return s as Tab;
  return 'feed';
}

export default function Community() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlightPost = searchParams.get('post');
  const tab = parseTab(searchParams.get('tab'));

  const setTab = (t: Tab) => {
    const next = new URLSearchParams(searchParams.toString());
    next.set('tab', t);
    router.replace(`/community?${next.toString()}`);
  };

  const { isLoggedIn, user } = useAuth();
  const [posts, setPosts] = useState<ApiFeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentsByPost, setCommentsByPost] = useState<Record<string, ApiCommentNode[]>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  const [groups, setGroups] = useState<
    {
      id: string;
      name: string;
      description: string | null;
      coverUrl: string | null;
      isPublic: boolean;
      memberCount: number;
      postCount: number;
    }[]
  >([]);
  const [myGroups, setMyGroups] = useState<
    { id: string; name: string; isPublic: boolean; myRole: string }[]
  >([]);
  const [pendingGroupIds, setPendingGroupIds] = useState<Set<string>>(() => new Set());
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newGroupCover, setNewGroupCover] = useState('');
  const [newGroupPublic, setNewGroupPublic] = useState(true);
  const [createGroupLoading, setCreateGroupLoading] = useState(false);
  const [loginPromptOpen, setLoginPromptOpen] = useState(false);
  const [conn, setConn] = useState<{ id: string; fromUser: { id: string; name: string } }[]>([]);
  const [network, setNetwork] = useState<{ id: string; name: string; email: string }[]>([]);
  const [searchQ, setSearchQ] = useState('');
  const [searchRes, setSearchRes] = useState<{ id: string; name: string; email: string }[]>([]);
  const [convs, setConvs] = useState<{ id: string; otherUser: { id: string; name: string } }[]>([]);

  const loadFeed = useCallback(() => {
    setLoading(true);
    fetchFeed({ page: 1 }).then((r) => {
      if (r.ok) setPosts(r.posts);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  useEffect(() => {
    listGroups({ page: 1 }).then((r) => {
      if (r.ok) setGroups(r.groups);
    });
    if (isLoggedIn) {
      listMyGroups().then((r) => {
        if (r.ok) {
          setMyGroups(r.groups.map((g) => ({ id: g.id, name: g.name, isPublic: g.isPublic, myRole: g.myRole })));
          setPendingGroupIds(new Set(r.pendingRequests.map((p) => p.groupId)));
        }
      });
      listIncomingConnections().then((r) => {
        if (r.ok) setConn(r.requests);
      });
      listConversations().then((r) => {
        if (r.ok) setConvs(r.conversations);
      });
      listConnections().then((r) => {
        if (r.ok) setNetwork(r.connections);
      });
    } else {
      setNetwork([]);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (!highlightPost || posts.length === 0) return;
    const el = document.getElementById(`post-${highlightPost}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [highlightPost, posts]);

  const loadComments = async (postId: string) => {
    const r = await listComments('feed', postId);
    if (r.ok) setCommentsByPost((s) => ({ ...s, [postId]: r.comments }));
  };

  useEffect(() => {
    for (const p of posts) {
      void loadComments(p.id);
    }
  }, [posts]);

  const submitPost = async (payload: { body: string; bodyHtml: string | null; imageUrls: string[] }) => {
    if (!isLoggedIn) {
      setLoginPromptOpen(true);
      return;
    }
    const r = await createFeedPost({
      body: payload.body,
      bodyHtml: payload.bodyHtml,
      imageUrls: payload.imageUrls,
    });
    if (r.ok) loadFeed();
  };

  const reactPost = async (post: ApiFeedPost, emoji: string) => {
    if (!isLoggedIn) {
      setLoginPromptOpen(true);
      return;
    }
    await setReaction({ targetType: 'feed_post', targetId: post.id, emoji });
    loadFeed();
  };

  const sendTopComment = async (postId: string) => {
    if (!isLoggedIn) {
      setLoginPromptOpen(true);
      return;
    }
    const t = (commentInputs[postId] || '').trim();
    if (!t) return;
    const r = await postComment('feed', postId, t);
    if (r.ok) {
      setCommentInputs((s) => ({ ...s, [postId]: '' }));
      await loadComments(postId);
    }
  };

  useEffect(() => {
    if (searchQ.length < 2) {
      setSearchRes([]);
      return;
    }
    const t = setTimeout(() => {
      searchUsers(searchQ).then((r) => {
        if (r.ok) setSearchRes(r.users.filter((u) => u.id !== user?.id));
      });
    }, 320);
    return () => clearTimeout(t);
  }, [searchQ, user?.id]);

  const NavBtn = ({
    value,
    icon: Icon,
    label,
  }: {
    value: Tab;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
  }) => (
    <button
      type="button"
      onClick={() => setTab(value)}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-semibold transition-colors ${
        tab === value ? 'bg-primary/15 text-primary' : 'hover:bg-muted/80 text-foreground/90'
      }`}
    >
      <Icon className="w-5 h-5 shrink-0 opacity-90" />
      {label}
    </button>
  );

  const myGroupIdSet = new Set(myGroups.map((g) => g.id));

  const joinActionLabel = (g: (typeof groups)[0]) => {
    if (myGroupIdSet.has(g.id)) return 'Joined';
    if (pendingGroupIds.has(g.id)) return 'Pending';
    return g.isPublic ? 'Join' : 'Request';
  };

  const submitCreateGroup = async () => {
    const name = newGroupName.trim();
    if (name.length < 2) {
      toast.error('Enter a group name (at least 2 characters).');
      return;
    }
    setCreateGroupLoading(true);
    const cover = newGroupCover.trim();
    const r = await createGroup({
      name,
      description: newGroupDesc.trim() || undefined,
      coverUrl: cover || undefined,
      isPublic: newGroupPublic,
    });
    setCreateGroupLoading(false);
    if (r.ok) {
      toast.success('Group created');
      setCreateGroupOpen(false);
      setNewGroupName('');
      setNewGroupDesc('');
      setNewGroupCover('');
      setNewGroupPublic(true);
      listGroups({ page: 1 }).then((x) => x.ok && setGroups(x.groups));
      listMyGroups().then((mg) => {
        if (mg.ok) {
          setMyGroups(mg.groups.map((g) => ({ id: g.id, name: g.name, isPublic: g.isPublic, myRole: g.myRole })));
          setPendingGroupIds(new Set(mg.pendingRequests.map((p) => p.groupId)));
        }
      });
      router.push(`/community/groups/${r.group.id}`);
    } else toast.error(r.error);
  };

  return (
    <div className="pt-24 pb-16 min-h-screen bg-[#f0f2f5] dark:bg-background">
      <LoginRequiredDialog open={loginPromptOpen} onOpenChange={setLoginPromptOpen} />
      <Dialog open={createGroupOpen} onOpenChange={setCreateGroupOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create a group</DialogTitle>
            <DialogDescription>
              Public groups are discoverable by everyone. Private groups require approval to join.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label htmlFor="cg-name" className="text-sm font-medium">
                Name
              </label>
              <Input
                id="cg-name"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Group name"
                className="rounded-xl"
                maxLength={120}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="cg-desc" className="text-sm font-medium">
                Description (optional)
              </label>
              <Input
                id="cg-desc"
                value={newGroupDesc}
                onChange={(e) => setNewGroupDesc(e.target.value)}
                placeholder="What is this group about?"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="cg-cover" className="text-sm font-medium">
                Cover image URL (optional)
              </label>
              <Input
                id="cg-cover"
                value={newGroupCover}
                onChange={(e) => setNewGroupCover(e.target.value)}
                placeholder="https://…"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <span className="text-sm font-medium block">Visibility</span>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={newGroupPublic ? 'default' : 'outline'}
                  className="rounded-xl flex-1"
                  onClick={() => setNewGroupPublic(true)}
                >
                  Public
                </Button>
                <Button
                  type="button"
                  variant={!newGroupPublic ? 'default' : 'outline'}
                  className="rounded-xl flex-1"
                  onClick={() => setNewGroupPublic(false)}
                >
                  Private
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => setCreateGroupOpen(false)}>
              Cancel
            </Button>
            <Button type="button" className="rounded-xl" disabled={createGroupLoading} onClick={submitCreateGroup}>
              {createGroupLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create group'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="container mx-auto px-3 md:px-4 max-w-[1320px]">
        <div className="hidden md:block text-center mb-6">
          <h1 className="text-2xl font-black tracking-tight">Community</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Feed, network, groups, and messages — in one place.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_300px] gap-4 items-start">
          {/* Left — Facebook-style shortcuts */}
          <aside className="hidden lg:block space-y-2 sticky top-24">
            <Card className="rounded-xl shadow-sm border-border/60 overflow-hidden">
              <CardContent className="p-2 space-y-0.5">
                <NavBtn value="feed" icon={Home} label="Feed" />
                <NavBtn value="people" icon={Users} label="People" />
                <NavBtn value="groups" icon={UsersRound} label="Groups" />
                <NavBtn value="messages" icon={MessageCircle} label="Messages" />
              </CardContent>
            </Card>
            <Card className="rounded-xl shadow-sm border-border/60">
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm font-bold text-muted-foreground">Your shortcuts</CardTitle>
              </CardHeader>
              <CardContent className="px-2 pb-3 space-y-1">
                {(isLoggedIn ? myGroups : []).slice(0, 6).map((g) => (
                  <Link
                    key={g.id}
                    href={`/community/groups/${g.id}`}
                    className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-muted/60 text-sm font-medium"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center text-xs font-black text-primary">
                      {g.name.slice(0, 1)}
                    </div>
                    <span className="truncate">{g.name}</span>
                  </Link>
                ))}
                {isLoggedIn && myGroups.length === 0 ? (
                  <p className="text-xs text-muted-foreground px-2">Join a group to see it here.</p>
                ) : null}
              </CardContent>
            </Card>
          </aside>

          {/* Mobile tab bar */}
          <div className="lg:hidden flex gap-1 p-1 bg-muted/50 rounded-xl mb-2 overflow-x-auto">
            {(
              [
                ['feed', Home, 'Feed'],
                ['people', Users, 'People'],
                ['groups', UsersRound, 'Groups'],
                ['messages', MessageCircle, 'Messages'],
              ] as const
            ).map(([id, Icon, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`flex-1 min-w-[72px] flex flex-col items-center gap-1 py-2 rounded-lg text-xs font-bold ${
                  tab === id ? 'bg-background shadow-sm' : 'text-muted-foreground'
                }`}
              >
                <Icon className="w-5 h-5" />
                {label}
              </button>
            ))}
          </div>

          {/* Center */}
          <main className="min-w-0 max-w-[680px] mx-auto w-full space-y-4">
            {tab === 'feed' ? (
              <>
                {isLoggedIn ? (
                  <FacebookComposer
                    onSubmit={submitPost}
                    placeholder={`What's on your mind${user?.name ? `, ${user.name.split(' ')[0]}` : ''}?`}
                  />
                ) : (
                  <div className="rounded-xl bg-card border border-border/60 p-4 text-center text-sm text-muted-foreground">
                    <Button variant="link" className="p-0 h-auto font-bold" onClick={() => setLoginPromptOpen(true)}>
                      Sign in
                    </Button>{' '}
                    to post, react, and comment.
                  </div>
                )}

                {loading ? (
                  <div className="flex justify-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {posts.map((p) => (
                      <FeedPostCard
                        key={p.id}
                        post={p}
                        highlight={highlightPost === p.id}
                        comments={commentsByPost[p.id] || []}
                        commentDraft={commentInputs[p.id] || ''}
                        onCommentDraft={(v) => setCommentInputs((s) => ({ ...s, [p.id]: v }))}
                        onSendComment={() => sendTopComment(p.id)}
                        onRefreshComments={() => loadComments(p.id)}
                        onReact={(emoji) => reactPost(p, emoji)}
                        onShare={async () => {
                          await shareFeedPost(p.id);
                          loadFeed();
                        }}
                        isLoggedIn={!!isLoggedIn}
                        onLogin={() => setLoginPromptOpen(true)}
                      />
                    ))}
                    {posts.length === 0 ? (
                      <p className="text-center text-muted-foreground py-12 rounded-xl bg-card border border-dashed">
                        No posts yet. Say hello to the community!
                      </p>
                    ) : null}
                  </div>
                )}
              </>
            ) : null}

            {tab === 'people' ? (
              <div className="space-y-4">
                <Card className="rounded-xl shadow-sm border-border/60 overflow-hidden">
                  <CardHeader className="border-b border-border/50 bg-card">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-primary" /> Grow your network
                    </CardTitle>
                    <p className="text-sm text-muted-foreground font-normal">
                      Search professionals and send connection requests — like LinkedIn.
                    </p>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4">
                    <Input
                      placeholder="Search by name or email…"
                      className="rounded-full h-11 bg-muted/30 border-border/60"
                      value={searchQ}
                      onChange={(e) => setSearchQ(e.target.value)}
                    />
                    <ul className="space-y-3">
                      {searchRes.map((u) => (
                        <li
                          key={u.id}
                          className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border border-border/50 bg-background hover:border-primary/25 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sky-500/20 to-sky-600/5 flex items-center justify-center text-lg font-black text-sky-700 dark:text-sky-400 shrink-0">
                              {u.name.slice(0, 1).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold truncate">{u.name}</p>
                              <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-full font-semibold"
                              onClick={async () => {
                                if (!isLoggedIn) {
                                  setLoginPromptOpen(true);
                                  return;
                                }
                                await followUser(u.id);
                              }}
                            >
                              Follow
                            </Button>
                            <Button
                              size="sm"
                              className="rounded-full font-semibold"
                              onClick={async () => {
                                if (!isLoggedIn) {
                                  setLoginPromptOpen(true);
                                  return;
                                }
                                await requestConnection(u.id);
                              }}
                            >
                              Connect
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              className="rounded-full font-semibold"
                              disabled={!isLoggedIn}
                              onClick={async () => {
                                const r = await openOrCreateConversation(u.id);
                                if (r.ok) router.push(`/dashboard/messages?c=${encodeURIComponent(r.conversationId)}`);
                              }}
                            >
                              Message
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {isLoggedIn && network.length > 0 ? (
                  <Card className="rounded-xl shadow-sm border-border/60">
                    <CardHeader>
                      <CardTitle className="text-base">My network</CardTitle>
                      <p className="text-xs text-muted-foreground font-normal">
                        People you are connected with.
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {network.map((c) => (
                        <div
                          key={c.id}
                          className="flex items-center justify-between gap-2 p-3 rounded-xl bg-muted/30 border border-border/40"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center font-bold text-primary shrink-0">
                              {c.name.slice(0, 1)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-sm truncate">{c.name}</p>
                              <p className="text-xs text-muted-foreground truncate">{c.email}</p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-full shrink-0"
                            onClick={async () => {
                              const r = await openOrCreateConversation(c.id);
                              if (r.ok) router.push(`/dashboard/messages?c=${encodeURIComponent(r.conversationId)}`);
                            }}
                          >
                            Message
                          </Button>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ) : null}

                {conn.length > 0 ? (
                  <Card className="rounded-xl shadow-sm border-border/60">
                    <CardHeader>
                      <CardTitle className="text-base">Invitations</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {conn.map((c) => (
                        <div
                          key={c.id}
                          className="flex flex-wrap justify-between gap-2 items-center p-3 rounded-xl bg-muted/40 border border-border/50"
                        >
                          <span className="font-medium">{c.fromUser.name}</span>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="rounded-full"
                              onClick={async () => {
                                await respondConnection(c.id, true);
                                listIncomingConnections().then((r) => {
                                  if (r.ok) setConn(r.requests);
                                });
                                listConnections().then((r) => {
                                  if (r.ok) setNetwork(r.connections);
                                });
                              }}
                            >
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-full"
                              onClick={async () => {
                                await respondConnection(c.id, false);
                                listIncomingConnections().then((r) => {
                                  if (r.ok) setConn(r.requests);
                                });
                              }}
                            >
                              Ignore
                            </Button>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ) : null}
              </div>
            ) : null}

            {tab === 'groups' ? (
              <Card className="rounded-xl shadow-sm border-border/60">
                <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 border-b border-border/50">
                  <div>
                    <CardTitle className="text-lg">Groups</CardTitle>
                    <p className="text-sm text-muted-foreground font-normal mt-1">
                      Discover communities — open a group for discussion and chat.
                    </p>
                  </div>
                  {isLoggedIn ? (
                    <Button size="sm" className="rounded-full font-bold" onClick={() => setCreateGroupOpen(true)}>
                      Create
                    </Button>
                  ) : null}
                </CardHeader>
                <CardContent className="space-y-3 pt-6">
                  {groups.map((g) => (
                    <Link
                      key={g.id}
                      href={`/community/groups/${g.id}`}
                      className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border border-border/50 bg-card hover:bg-muted/40 transition-colors group"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-14 h-14 rounded-xl bg-primary/15 overflow-hidden shrink-0 flex items-center justify-center text-lg font-black text-primary">
                          {g.coverUrl ? (
                            <img
                              src={g.coverUrl}
                              alt=""
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            g.name.slice(0, 1)
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-base group-hover:text-primary transition-colors">{g.name}</p>
                          <p className="text-xs font-semibold text-primary/80 mt-0.5">
                            {g.isPublic ? 'Public' : 'Private'}
                          </p>
                          <p className="text-sm text-muted-foreground line-clamp-2">{g.description}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {g.memberCount} members · {g.postCount} posts
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant={myGroupIdSet.has(g.id) ? 'outline' : 'secondary'}
                          className="rounded-full"
                          disabled={myGroupIdSet.has(g.id) || pendingGroupIds.has(g.id)}
                          onClick={async (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (!isLoggedIn) {
                              setLoginPromptOpen(true);
                              return;
                            }
                            const r = await joinGroup(g.id);
                            if (r.ok) {
                              if (r.status === 'pending') {
                                toast.success('Request sent', {
                                  description: 'An admin will approve or decline.',
                                });
                                setPendingGroupIds((prev) => new Set(prev).add(g.id));
                              } else {
                                toast.success('Joined group');
                                listMyGroups().then((mg) => {
                                  if (mg.ok) {
                                    setMyGroups(
                                      mg.groups.map((x) => ({
                                        id: x.id,
                                        name: x.name,
                                        isPublic: x.isPublic,
                                        myRole: x.myRole,
                                      }))
                                    );
                                    setPendingGroupIds(new Set(mg.pendingRequests.map((p) => p.groupId)));
                                  }
                                });
                              }
                            } else {
                              toast.error(r.error || 'Could not join');
                            }
                          }}
                        >
                          {joinActionLabel(g)}
                        </Button>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </Link>
                  ))}
                  {groups.length === 0 ? <p className="text-muted-foreground">No groups yet.</p> : null}
                </CardContent>
              </Card>
            ) : null}

            {tab === 'messages' ? (
              <Card className="rounded-xl shadow-sm border-border/60">
                <CardHeader className="border-b border-border/50">
                  <CardTitle className="text-lg">Messages</CardTitle>
                  <p className="text-sm text-muted-foreground font-normal">
                    Messenger-style inbox lives in your dashboard.
                  </p>
                </CardHeader>
                <CardContent className="pt-6">
                  {!isLoggedIn ? (
                    <p className="text-muted-foreground">
                      <Button variant="link" className="p-0 h-auto font-bold" onClick={() => router.push('/login')}>
                        Sign in
                      </Button>{' '}
                      for direct messages.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {convs.map((c) => (
                        <Link
                          key={c.id}
                          href={`/dashboard/messages?c=${c.id}`}
                          className="flex items-center gap-3 p-4 rounded-xl border border-border/50 hover:bg-muted/50 transition-colors"
                        >
                          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500/25 to-blue-600/10 flex items-center justify-center font-bold text-blue-700 dark:text-blue-300">
                            {c.otherUser.name.slice(0, 1)}
                          </div>
                          <div>
                            <p className="font-bold">{c.otherUser.name}</p>
                            <p className="text-xs text-primary font-semibold">Open in Messenger</p>
                          </div>
                          <ChevronRight className="w-5 h-5 ml-auto text-muted-foreground" />
                        </Link>
                      ))}
                      {convs.length === 0 ? (
                        <p className="text-muted-foreground text-sm">No conversations yet. Connect with someone in People.</p>
                      ) : null}
                      <Link
                        href="/dashboard/messages"
                        className="inline-flex items-center justify-center w-full rounded-full mt-4 h-10 px-4 border border-border bg-background font-semibold text-sm hover:bg-muted/80 transition-colors"
                      >
                        Open full inbox
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : null}
          </main>

          {/* Right — contacts / promo */}
          <aside className="hidden lg:block sticky top-24 space-y-3">
            <Card className="rounded-xl shadow-sm border-border/60">
              <CardHeader className="py-3">
                <CardTitle className="text-sm font-bold text-muted-foreground">Contacts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                {isLoggedIn && network.slice(0, 8).map((c) => (
                  <div key={c.id} className="flex items-center gap-2 text-sm font-medium">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                      {c.name.slice(0, 1)}
                    </div>
                    <span className="truncate">{c.name}</span>
                  </div>
                ))}
                {!isLoggedIn ? (
                  <p className="text-xs text-muted-foreground">Sign in to see your network here.</p>
                ) : network.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No connections yet — find people in the People tab.</p>
                ) : null}
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}
