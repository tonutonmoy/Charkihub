'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import JSZip from 'jszip';
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

// Helper functions for download
function getFileExtension(url: string, mimeType?: string): string {
  const lastDot = url.lastIndexOf('.');
  if (lastDot !== -1 && lastDot < url.length - 1) {
    const ext = url.slice(lastDot + 1).split('?')[0].toLowerCase();
    if (ext) return ext;
  }
  if (mimeType) {
    if (mimeType.includes('jpeg') || mimeType.includes('jpg')) return 'jpg';
    if (mimeType === 'image/png') return 'png';
    if (mimeType === 'application/pdf') return 'pdf';
    if (mimeType.includes('zip')) return 'zip';
  }
  return 'file';
}

async function downloadSingleFile(url: string, filename: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error('Network error');
  const blob = await response.blob();
  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(blobUrl);
}

async function downloadAsZip(files: { url: string; name: string }[], zipName: string) {
  const zip = new JSZip();
  for (const file of files) {
    const response = await fetch(file.url);
    if (response.ok) {
      const blob = await response.blob();
      zip.file(file.name, blob);
    }
  }
  const content = await zip.generateAsync({ type: 'blob' });
  const zipUrl = window.URL.createObjectURL(content);
  const link = document.createElement('a');
  link.href = zipUrl;
  link.download = zipName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(zipUrl);
}

const JobDetails = () => {
  const params = useParams();
  const slug = params?.slug as string;
  const id = slug?.split('-')[0]; // string id from URL
  const router = useRouter();
  const { isLoggedIn } = useAuth();

  const [job, setJob] = useState<(ApiJobDetail & { attachments?: any[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comments, setComments] = useState<ApiCommentNode[]>([]);
  const [commentText, setCommentText] = useState('');
  const [downloading, setDownloading] = useState(false);

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
    listComments('job', id).then((c) => {
      if (c.ok) setComments(c.comments);
    });
  }, [id]);

  const handleShare = (platform: string) => {
    if (!job) return;
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const text = `Job: ${job.title} — ${job.organization}`;
    if (platform === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
    } else if (platform === 'linkedin') {
      window.open(`https://www.linkedin.com/sharing/share-offsite/?u=${encodeURIComponent(url)}`, '_blank');
    } else if (platform === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`, '_blank');
    } else {
      navigator.clipboard.writeText(url);
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
    } else {
      toast.error('Failed to post comment');
    }
  };

  const refreshComments = () => {
    if (!job) return;
    listComments('job', job.id).then((c) => {
      if (c.ok) setComments(c.comments);
    });
  };

  const handleDownload = async () => {
    if (!job) return;
    const files: { url: string; name: string }[] = [];

    if (job.attachments && Array.isArray(job.attachments)) {
      for (const att of job.attachments) {
        if (att.url) {
          const ext = getFileExtension(att.url, att.mimeType);
          const name = att.name || `attachment_${Date.now()}.${ext}`;
          files.push({ url: att.url, name });
        }
      }
    }

    if (job.pdfUrl && !files.some(f => f.url === job.pdfUrl)) {
      const name = `document_${job.id}.pdf`;
      files.push({ url: job.pdfUrl, name });
    }

    if (files.length === 0) {
      toast.info('No documents attached to this job.');
      return;
    }

    setDownloading(true);
    try {
      if (files.length === 1) {
        await downloadSingleFile(files[0].url, files[0].name);
        toast.success(`Downloaded: ${files[0].name}`);
      } else {
        const zipName = `${job.title.replace(/[^a-z0-9]/gi, '_')}_documents.zip`;
        await downloadAsZip(files, zipName);
        toast.success(`Downloaded ${files.length} files as ZIP`);
      }
    } catch (err) {
      console.error(err);
      toast.error('Download failed. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const getDownloadButtonText = () => {
    if (!job) return 'Download';
    let count = 0;
    if (job.attachments) count += job.attachments.length;
    if (job.pdfUrl) count++;
    if (count === 0) return 'No documents';
    if (count === 1) return 'Download document';
    return `Download all (${count} files)`;
  };

  if (loading) {
    return <div className="pt-32 pb-20 min-h-screen container mx-auto px-4 text-center text-muted-foreground">Loading…</div>;
  }

  if (error || !job) {
    return (
      <div className="pt-32 pb-20 min-h-screen container mx-auto px-4">
        <p className="text-center text-destructive">{error || 'Not found'}</p>
        <Button variant="ghost" className="mt-8" onClick={() => router.push('/jobs')}>Back to jobs</Button>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-20 min-h-screen bg-muted/30">
      <div className="container mx-auto px-4 max-w-4xl">
        <Button variant="ghost" className="mb-8 font-bold hover:bg-primary/10 hover:text-primary transition-all rounded-xl" onClick={() => router.push('/jobs')}>
          <ArrowLeft className="mr-2 w-5 h-5" /> Back to Jobs
        </Button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Card className="rounded-[2.5rem] overflow-hidden border-border/50 shadow-2xl shadow-primary/5 bg-card">
            <div className="bg-primary p-8 md:p-12 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-12 opacity-10"><Building2 className="w-48 h-48" /></div>
              <div className="relative z-10">
                <div className="flex flex-wrap gap-3 mb-6">
                  <Badge className="bg-white/20 hover:bg-white/30 text-white border-none rounded-lg px-4 py-1 font-black uppercase tracking-widest">{job.subCategory}</Badge>
                  <Badge className="bg-secondary text-white border-none rounded-lg px-4 py-1 font-black uppercase tracking-widest">{job.mainCategory}</Badge>
                </div>
                <h1 className="text-3xl md:text-5xl font-black mb-4 tracking-tight leading-tight">{job.title}</h1>
                <p className="text-xl text-primary-foreground/90 font-bold mb-4 flex items-center gap-2"><Building2 className="w-6 h-6" />{job.organization}</p>
                <p className="text-primary-foreground/90 mb-6 font-medium">{job.summary}</p>
                <div className="flex flex-wrap gap-6 text-sm font-bold">
                  <div className="flex items-center gap-2"><MapPin className="w-5 h-5" />{job.localArea || job.countryCode}</div>
                  <div className="flex items-center gap-2"><Calendar className="w-5 h-5" />Apply window: {new Date(job.startAt).toLocaleString()} — {new Date(job.endAt).toLocaleString()}</div>
                </div>
              </div>
            </div>

            <CardContent className="p-8 md:p-12">
              {job.alertEnabled && job.alertMessage && (
                <div className="mb-8 p-4 rounded-2xl border border-amber-500/40 bg-amber-500/10 flex gap-3">
                  <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
                  <p className="text-sm font-medium text-amber-900 dark:text-amber-100">{job.alertMessage}</p>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2 space-y-10">
                  {job.description && (
                    <section>
                      <h2 className="text-2xl font-black mb-4 tracking-tight">Details</h2>
                      <p className="text-muted-foreground leading-relaxed text-lg whitespace-pre-wrap">{job.description}</p>
                    </section>
                  )}
                  <section>
                    <h2 className="text-2xl font-black mb-4 tracking-tight flex items-center gap-2"><MessageCircle className="w-6 h-6" /> Comments</h2>
                    {isLoggedIn ? (
                      <form onSubmit={sendComment} className="flex gap-2 mb-6">
                        <Input value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Write a comment…" className="rounded-xl" />
                        <Button type="submit" className="rounded-xl">Post</Button>
                      </form>
                    ) : (
                      <p className="text-sm text-muted-foreground mb-4">
                        <Button variant="link" className="p-0 h-auto" onClick={() => router.push('/login')}>Sign in</Button> to comment.
                      </p>
                    )}
                    <CommentThread targetType="job" targetId={job.id} nodes={comments} isLoggedIn={!!isLoggedIn} onLogin={() => router.push('/login')} onRefresh={refreshComments} />
                  </section>
                </div>

                <div className="lg:col-span-1 space-y-8">
                  <div className="space-y-4">
                    {job.applyUrl ? (
                      <a href={job.applyUrl} target="_blank" rel="noopener noreferrer" className={cn(buttonVariants({ variant: 'default', size: 'lg' }), 'w-full h-14 rounded-2xl font-black text-lg shadow-xl shadow-primary/20')}>Apply now</a>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center">Apply link not provided.</p>
                    )}
                    {job.phone && <p className="text-center text-sm font-bold">Phone: <a href={`tel:${job.phone}`}>{job.phone}</a></p>}

                    {(job.attachments?.length || job.pdfUrl) && (
                      <Button variant="outline" size="lg" className="w-full h-14 rounded-2xl font-black text-lg border-2 gap-2" onClick={handleDownload} disabled={downloading}>
                        <Download className="w-5 h-5" />
                        {downloading ? 'Preparing...' : getDownloadButtonText()}
                      </Button>
                    )}

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
                      <Button variant="outline" className="rounded-xl h-12" onClick={() => handleShare('facebook')}><Facebook className="w-5 h-5" /></Button>
                      <Button variant="outline" className="rounded-xl h-12" onClick={() => handleShare('whatsapp')}><FontAwesomeIcon className="w-5 h-5" icon={faWhatsapp} /></Button>
                      <Button variant="outline" className="rounded-xl h-12" onClick={() => handleShare('linkedin')}><Linkedin className="w-5 h-5" /></Button>
                      <Button variant="outline" className="rounded-xl h-12" onClick={() => handleShare('copy')}><LinkIcon className="w-5 h-5" /></Button>
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