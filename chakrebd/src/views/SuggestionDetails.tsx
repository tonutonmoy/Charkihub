'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Download,
  Lightbulb,
  Facebook,
  Twitter,
  Linkedin,
  Link as LinkIcon,
  Check,
  Star,
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import {
  getSuggestion,
  addFavorite,
  removeFavorite,
  type ApiSuggestionListItem,
} from '@/lib/api';
import { useAuth } from '../components/AuthContext';

const SuggestionDetails = () => {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { isLoggedIn } = useAuth();

  const [item, setItem] = useState<(ApiSuggestionListItem & { favorited?: boolean }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [showCopyPopup, setShowCopyPopup] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getSuggestion(id).then((r) => {
      setLoading(false);
      if (!r.ok) {
        setErr(r.error);
        return;
      }
      setItem(r.suggestion);
    });
  }, [id]);

  const handleShare = (platform: string) => {
    if (!item) return;
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const text = item.title;
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
    if (!item || !isLoggedIn) {
      router.push('/login');
      return;
    }
    if (item.favorited) {
      const r = await removeFavorite('suggestion', item.id);
      if (r.ok) setItem({ ...item, favorited: false });
    } else {
      const r = await addFavorite('suggestion', item.id);
      if (r.ok) setItem({ ...item, favorited: true });
    }
  };

  if (loading) {
    return <div className="pt-32 pb-20 text-center text-muted-foreground min-h-screen">Loading…</div>;
  }
  if (err || !item) {
    return (
      <div className="pt-32 pb-20 container px-4">
        <p className="text-destructive text-center">{err || 'Not found'}</p>
        <Button variant="ghost" className="mt-8 mx-auto block" onClick={() => router.push('/suggestions')}>
          Back
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
          onClick={() => router.push('/suggestions')}
        >
          <ArrowLeft className="mr-2 w-5 h-5" /> Back to Suggestions
        </Button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="rounded-[2.5rem] overflow-hidden border-border/50 shadow-2xl shadow-primary/5 bg-card">
            <div className="bg-gradient-to-br from-primary to-primary/80 p-8 md:p-12 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-12 opacity-10">
                <Lightbulb className="w-48 h-48" />
              </div>
              <div className="relative z-10">
                <div className="flex flex-wrap gap-3 mb-6 items-center">
                  <Badge className="bg-white/20 text-white border-none rounded-lg px-4 py-1 font-black uppercase tracking-widest">
                    {item.category}
                  </Badge>
                  <Badge className="bg-white/10 text-white border-none rounded-lg px-4 py-1 font-bold">{item.countryCode}</Badge>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="rounded-xl gap-1 bg-white/20 text-white border-0 hover:bg-white/30"
                    onClick={toggleFav}
                  >
                    <Star className={`w-4 h-4 ${item.favorited ? 'fill-current' : ''}`} />
                    Save
                  </Button>
                </div>
                <h1 className="text-3xl md:text-5xl font-black mb-6 tracking-tight leading-tight">{item.title}</h1>
                <p className="text-lg text-white/90 font-medium max-w-3xl">{item.summary}</p>
              </div>
            </div>

            <CardContent className="p-8 md:p-12">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2 space-y-8">
                  {item.content ? (
                    <section className="prose prose-lg dark:prose-invert max-w-none text-muted-foreground">
                      <ReactMarkdown>{item.content}</ReactMarkdown>
                    </section>
                  ) : (
                    <p className="text-muted-foreground">No extra content.</p>
                  )}
                </div>

                <div className="lg:col-span-1 space-y-6">
                  {item.externalUrl ? (
                    <a
                      href={item.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        buttonVariants({ variant: 'default', size: 'lg' }),
                        'w-full h-14 rounded-2xl font-black text-lg justify-center'
                      )}
                    >
                      Open resource
                    </a>
                  ) : null}
                  <div className="p-6 rounded-3xl border border-border/50 bg-card">
                    <h3 className="font-black mb-4 uppercase tracking-widest text-xs text-muted-foreground">Share</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <Button variant="outline" className="rounded-xl h-12" type="button" onClick={() => handleShare('facebook')}>
                        <Facebook className="w-5 h-5" />
                      </Button>
                      <Button variant="outline" className="rounded-xl h-12" type="button" onClick={() => handleShare('twitter')}>
                        <Twitter className="w-5 h-5" />
                      </Button>
                      <Button variant="outline" className="rounded-xl h-12" type="button" onClick={() => handleShare('linkedin')}>
                        <Linkedin className="w-5 h-5" />
                      </Button>
                      <Button variant="outline" className="rounded-xl h-12" type="button" onClick={() => handleShare('copy')}>
                        <LinkIcon className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full h-12 rounded-2xl font-bold gap-2" type="button" disabled>
                    <Download className="w-5 h-5" /> PDF if linked by admin
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default SuggestionDetails;
