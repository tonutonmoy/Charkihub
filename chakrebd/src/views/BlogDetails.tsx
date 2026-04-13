'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Facebook,
  Twitter,
  Linkedin,
  Link as LinkIcon,
  Check,
  Star,
  MessageCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import ReactMarkdown from 'react-markdown';
import {
  getBlogPost,
  listComments,
  postComment,
  addFavorite,
  removeFavorite,
  type ApiBlogDetail,
  type ApiCommentNode,
} from '@/lib/api';
import { useAuth } from '../components/AuthContext';
import { CommentThread } from '../components/CommentThread';

const BlogDetails = () => {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { isLoggedIn } = useAuth();

  const [post, setPost] = useState<ApiBlogDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [showCopyPopup, setShowCopyPopup] = useState(false);
  const [comments, setComments] = useState<ApiCommentNode[]>([]);
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getBlogPost(id).then((r) => {
      setLoading(false);
      if (!r.ok) {
        setErr(r.error);
        return;
      }
      setPost(r.post);
    });
    const loadC = () =>
      listComments('blog', id).then((c) => {
        if (c.ok) setComments(c.comments);
      });
    loadC();
  }, [id]);

  const refreshComments = () => {
    if (!id) return;
    listComments('blog', id).then((c) => {
      if (c.ok) setComments(c.comments);
    });
  };

  const handleShare = (platform: string) => {
    if (!post) return;
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const text = post.title;
    if (platform === 'copy') {
      void navigator.clipboard.writeText(url);
      setShowCopyPopup(true);
      setTimeout(() => setShowCopyPopup(false), 2000);
    } else if (platform === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
    } else if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank');
    } else if (platform === 'linkedin') {
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
    }
  };

  const toggleFav = async () => {
    if (!post || !isLoggedIn) {
      router.push('/login');
      return;
    }
    if (post.favorited) {
      const r = await removeFavorite('blog', post.id);
      if (r.ok) setPost({ ...post, favorited: false });
    } else {
      const r = await addFavorite('blog', post.id);
      if (r.ok) setPost({ ...post, favorited: true });
    }
  };

  const sendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!post || !commentText.trim() || !isLoggedIn) return;
    const r = await postComment('blog', post.id, commentText.trim());
    if (r.ok) {
      setCommentText('');
      refreshComments();
    }
  };

  if (loading) {
    return (
      <div className="pt-32 pb-20 text-center text-muted-foreground min-h-screen">Loading…</div>
    );
  }
  if (err || !post) {
    return (
      <div className="pt-32 pb-20 container mx-auto px-4">
        <p className="text-destructive text-center">{err || 'Not found'}</p>
        <Button variant="ghost" className="mt-8 mx-auto block" onClick={() => router.push('/blog')}>
          Back to blog
        </Button>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-20 min-h-screen bg-muted/30 relative">
      <AnimatePresence>
        {showCopyPopup && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className="fixed bottom-10 left-1/2 z-[100] bg-primary text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 font-bold"
          >
            <Check className="w-5 h-5" />
            Copied!
          </motion.div>
        )}
      </AnimatePresence>

      <div className="container mx-auto px-4 max-w-4xl">
        <Button
          variant="ghost"
          className="mb-8 font-bold hover:bg-primary/10 hover:text-primary transition-all rounded-xl"
          onClick={() => router.push('/blog')}
        >
          <ArrowLeft className="mr-2 w-5 h-5" /> Back to Blog
        </Button>

        <motion.article initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="rounded-[2.5rem] overflow-hidden border-border/50 shadow-2xl shadow-primary/5 bg-card">
            <div className="aspect-video relative overflow-hidden bg-gradient-to-br from-primary/30 to-secondary/20 flex items-center justify-center">
              <span className="text-8xl font-black text-primary/20">{post.countryCode}</span>
            </div>

            <CardContent className="p-8 md:p-12">
              <div className="flex flex-wrap items-center gap-4 mb-8">
                <Badge className="bg-primary/10 text-primary border-none rounded-lg px-4 py-1 font-black uppercase tracking-widest">
                  {post.category}
                </Badge>
                <span className="text-sm text-muted-foreground font-bold">
                  {new Date(post.createdAt).toLocaleString()}
                </span>
                <Button variant="secondary" size="sm" className="rounded-xl gap-1 ml-auto" onClick={toggleFav}>
                  <Star className={`w-4 h-4 ${post.favorited ? 'fill-current' : ''}`} />
                  Save
                </Button>
              </div>

              <h1 className="text-3xl md:text-5xl font-black mb-8 tracking-tight leading-tight">{post.title}</h1>
              <p className="text-lg text-muted-foreground mb-10">{post.excerpt}</p>

              <div className="prose prose-lg dark:prose-invert max-w-none text-muted-foreground">
                <ReactMarkdown>{post.content}</ReactMarkdown>
              </div>

              <section className="mt-12 pt-10 border-t border-border/50">
                <h3 className="text-xl font-black mb-4 flex items-center gap-2">
                  <MessageCircle className="w-6 h-6" /> Comments
                </h3>
                {isLoggedIn ? (
                  <form onSubmit={sendComment} className="flex gap-2 mb-6">
                    <Input
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Write a comment…"
                      className="rounded-xl"
                    />
                    <Button type="submit" className="rounded-xl">
                      Post
                    </Button>
                  </form>
                ) : (
                  <p className="text-sm text-muted-foreground mb-4">
                    <Button variant="link" className="p-0 h-auto" onClick={() => router.push('/login')}>
                      Sign in
                    </Button>{' '}
                    to comment.
                  </p>
                )}
                <CommentThread
                  targetType="blog"
                  targetId={post.id}
                  nodes={comments}
                  isLoggedIn={!!isLoggedIn}
                  onLogin={() => router.push('/login')}
                  onRefresh={refreshComments}
                />
              </section>

              <div className="mt-16 pt-10 border-t border-border/50">
                <h3 className="text-xl font-black mb-8 tracking-tight">Share</h3>
                <div className="flex flex-wrap gap-4">
                  <Button
                    variant="outline"
                    className="rounded-2xl h-12 px-6 font-bold"
                    onClick={() => handleShare('facebook')}
                    type="button"
                  >
                    <Facebook className="mr-2 w-5 h-5" /> Facebook
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-2xl h-12 px-6 font-bold"
                    onClick={() => handleShare('twitter')}
                    type="button"
                  >
                    <Twitter className="mr-2 w-5 h-5" /> Twitter
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-2xl h-12 px-6 font-bold"
                    onClick={() => handleShare('linkedin')}
                    type="button"
                  >
                    <Linkedin className="mr-2 w-5 h-5" /> LinkedIn
                  </Button>
                  <Button variant="outline" className="rounded-2xl h-12 px-6 font-bold" onClick={() => handleShare('copy')} type="button">
                    <LinkIcon className="mr-2 w-5 h-5" /> Copy link
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.article>
      </div>
    </div>
  );
};

export default BlogDetails;
