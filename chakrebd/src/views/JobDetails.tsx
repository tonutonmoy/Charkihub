'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Download,
  Calendar,
  MapPin,
  Building2,
  Facebook,
  Linkedin,
  LinkIcon,
  Heart,
  Star,
  AlertTriangle,
  MessageCircle,
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  getJob,
  likeJob,
  unlikeJob,
  addFavorite,
  removeFavorite,
  listComments,
  postComment,
  type ApiJobDetail,
  type ApiCommentNode,
} from '@/lib/api';
import { toast } from 'sonner';
import { useAuth } from '../components/AuthContext';
import { CommentThread } from '../components/CommentThread';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';

const JobDetails = () => {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { isLoggedIn } = useAuth();

  const [job, setJob] = useState<ApiJobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comments, setComments] = useState<ApiCommentNode[]>([]);
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getJob(id).then((r) => {
      setLoading(false);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setJob(r.job);
    });
    const loadC = () =>
      listComments('job', id).then((c) => {
        if (c.ok) setComments(c.comments);
      });
    loadC();
  }, [id]);

  const handleShare = (platform: string) => {
    if (!job) return;
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const text = `Job: ${job.title} — ${job.organization}`;
    
    if (platform === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
    } else if (platform === 'linkedin') {
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
    } else if (platform === 'whatsapp') {
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`;
      window.open(whatsappUrl, '_blank');
    } else {
      void navigator.clipboard.writeText(url);
      toast.success('Link copied');
    }
  };

  const toggleLike = async () => {
    if (!job || !isLoggedIn) {
      router.push('/login');
      return;
    }
    if (job.liked) {
      const r = await unlikeJob(job.id);
      if (r.ok) setJob({ ...job, liked: false, likeCount: r.likeCount });
    } else {
      const r = await likeJob(job.id);
      if (r.ok) setJob({ ...job, liked: true, likeCount: r.likeCount });
    }
  };

  const toggleFav = async () => {
    if (!job || !isLoggedIn) {
      router.push('/login');
      return;
    }
    if (job.favorited) {
      const r = await removeFavorite('job', job.id);
      if (r.ok) setJob({ ...job, favorited: false });
    } else {
      const r = await addFavorite('job', job.id);
      if (r.ok) setJob({ ...job, favorited: true });
    }
  };

  const sendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!job || !commentText.trim() || !isLoggedIn) return;
    const r = await postComment('job', job.id, commentText.trim());
    if (r.ok) {
      setCommentText('');
      listComments('job', job.id).then((c) => {
        if (c.ok) setComments(c.comments);
      });
    }
  };

  const refreshComments = () => {
    if (!job) return;
    listComments('job', job.id).then((c) => {
      if (c.ok) setComments(c.comments);
    });
  };

  if (loading) {
    return (
      <div className="pt-32 pb-20 min-h-screen container mx-auto px-4 text-center text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="pt-32 pb-20 min-h-screen container mx-auto px-4">
        <p className="text-center text-destructive">{error || 'Not found'}</p>
        <Button variant="ghost" className="mt-8" onClick={() => router.push('/jobs')}>
          Back to jobs
        </Button>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-20 min-h-screen bg-muted/30">
      <div className="container mx-auto px-4 max-w-4xl">
        <Button
          variant="ghost"
          className="mb-8 font-bold hover:bg-primary/10 hover:text-primary transition-all rounded-xl"
          onClick={() => router.push('/jobs')}
        >
          <ArrowLeft className="mr-2 w-5 h-5" /> Back to Jobs
        </Button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Card className="rounded-[2.5rem] overflow-hidden border-border/50 shadow-2xl shadow-primary/5 bg-card">
            <div className="bg-primary p-8 md:p-12 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-12 opacity-10">
                <Building2 className="w-48 h-48" />
              </div>
              <div className="relative z-10">
                <div className="flex flex-wrap gap-3 mb-6">
                  <Badge className="bg-white/20 hover:bg-white/30 text-white border-none rounded-lg px-4 py-1 font-black uppercase tracking-widest">
                    {job.subCategory}
                  </Badge>
                  <Badge className="bg-secondary text-white border-none rounded-lg px-4 py-1 font-black uppercase tracking-widest">
                    {job.mainCategory}
                  </Badge>
                </div>
                <h1 className="text-3xl md:text-5xl font-black mb-4 tracking-tight leading-tight">{job.title}</h1>
                <p className="text-xl text-primary-foreground/90 font-bold mb-4 flex items-center gap-2">
                  <Building2 className="w-6 h-6" />
                  {job.organization}
                </p>
                <p className="text-primary-foreground/90 mb-6 font-medium">{job.summary}</p>
                <div className="flex flex-wrap gap-6 text-sm font-bold">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    {job.localArea || job.countryCode}
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Apply window: {new Date(job.startAt).toLocaleString()} — {new Date(job.endAt).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            <CardContent className="p-8 md:p-12">
              {job.alertEnabled && job.alertMessage ? (
                <div className="mb-8 p-4 rounded-2xl border border-amber-500/40 bg-amber-500/10 flex gap-3">
                  <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
                  <p className="text-sm font-medium text-amber-900 dark:text-amber-100">{job.alertMessage}</p>
                </div>
              ) : null}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2 space-y-10">
                  {job.description ? (
                    <section>
                      <h2 className="text-2xl font-black mb-4 tracking-tight">Details</h2>
                      <p className="text-muted-foreground leading-relaxed text-lg whitespace-pre-wrap">{job.description}</p>
                    </section>
                  ) : null}

                  <section>
                    <h2 className="text-2xl font-black mb-4 tracking-tight flex items-center gap-2">
                      <MessageCircle className="w-6 h-6" /> Comments
                    </h2>
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
                    {job ? (
                      <CommentThread
                        targetType="job"
                        targetId={job.id}
                        nodes={comments}
                        isLoggedIn={!!isLoggedIn}
                        onLogin={() => router.push('/login')}
                        onRefresh={refreshComments}
                      />
                    ) : null}
                  </section>
                </div>

                <div className="lg:col-span-1 space-y-8">
                  <div className="space-y-4">
                    {job.applyUrl ? (
                      <a
                        href={job.applyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          buttonVariants({ variant: 'default', size: 'lg' }),
                          'w-full h-14 rounded-2xl font-black text-lg shadow-xl shadow-primary/20'
                        )}
                      >
                        Apply now
                      </a>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center">Apply link not provided.</p>
                    )}
                    {job.phone ? (
                      <p className="text-center text-sm font-bold">
                        Phone: <a href={`tel:${job.phone}`}>{job.phone}</a>
                      </p>
                    ) : null}
                    {job.pdfUrl ? (
                      <a
                        href={job.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          buttonVariants({ variant: 'outline', size: 'lg' }),
                          'w-full h-14 rounded-2xl font-black text-lg border-2 inline-flex items-center justify-center gap-2'
                        )}
                      >
                        <Download className="w-6 h-6" /> Download PDF
                      </a>
                    ) : null}
                    <div className="flex gap-2">
                      <Button variant="secondary" className="flex-1 rounded-xl gap-2" onClick={toggleLike}>
                        <Heart className={`w-5 h-5 ${job.liked ? 'fill-current' : ''}`} />
                        {job.likeCount}
                      </Button>
                      <Button variant="secondary" className="flex-1 rounded-xl gap-2" onClick={toggleFav}>
                        <Star className={`w-5 h-5 ${job.favorited ? 'fill-current' : ''}`} />
                        Save
                      </Button>
                    </div>
                  </div>

                  <div className="p-8 rounded-3xl border border-border/50 bg-card">
                    <h3 className="font-black mb-6 uppercase tracking-widest text-xs text-muted-foreground">Share</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        variant="outline"
                        className="rounded-xl h-12"
                        onClick={() => handleShare('facebook')}
                        type="button"
                      >
                        <Facebook className="w-5 h-5" />
                      </Button>
                      <Button
                        variant="outline"
                        className="rounded-xl h-12"
                        onClick={() => handleShare('whatsapp')}
                        type="button"
                      >
                        <FontAwesomeIcon className="w-5 h-5" icon={faWhatsapp} />
                      </Button>
                      <Button
                        variant="outline"
                        className="rounded-xl h-12"
                        onClick={() => handleShare('linkedin')}
                        type="button"
                      >
                        <Linkedin className="w-5 h-5" />
                      </Button>
                      <Button variant="outline" className="rounded-xl h-12" onClick={() => handleShare('copy')} type="button">
                        <LinkIcon className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default JobDetails;