'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Share2,
  Download,
  Database,
  Facebook,
  Twitter,
  Linkedin,
  Link as LinkIcon,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { getQBankItem, type ApiQBankItem } from '@/lib/api';

const QuestionDetails = () => {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const [item, setItem] = useState<ApiQBankItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCopyPopup, setShowCopyPopup] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getQBankItem(id).then((r) => {
      if (r.ok) setItem(r.item);
      else setItem(null);
      setLoading(false);
    });
  }, [id]);

  const handleShare = (platform: string) => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    if (platform === 'copy') {
      void navigator.clipboard.writeText(url);
      setShowCopyPopup(true);
      setTimeout(() => setShowCopyPopup(false), 2000);
    } else {
      const text = item ? `Check out: ${item.title}` : '';
      if (platform === 'facebook')
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
      if (platform === 'twitter')
        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank');
      if (platform === 'linkedin')
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="pt-32 pb-20 min-h-screen flex items-center justify-center text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (!item) {
    return (
      <div className="pt-32 pb-20 min-h-screen container px-4">
        <p className="text-muted-foreground">Question set not found.</p>
        <Button variant="ghost" className="mt-4 rounded-xl" onClick={() => router.push('/qbank')}>
          Back to Question Bank
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
            className="fixed bottom-10 left-1/2 z-[100] bg-primary text-primary-foreground px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 font-bold"
          >
            <Check className="w-5 h-5" />
            Link copied to clipboard!
          </motion.div>
        )}
      </AnimatePresence>

      <div className="container mx-auto px-4 max-w-4xl">
        <Button
          variant="ghost"
          className="mb-8 font-bold hover:bg-primary/10 hover:text-primary transition-all rounded-xl"
          onClick={() => router.back()}
        >
          <ArrowLeft className="mr-2 w-5 h-5" /> Back to Question Bank
        </Button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="rounded-[2.5rem] overflow-hidden border-border/50 shadow-2xl shadow-primary/5 bg-card">
            <div className="bg-slate-900 p-8 md:p-12 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-12 opacity-10">
                <Database className="w-48 h-48" />
              </div>
              <div className="relative z-10">
                <div className="flex flex-wrap gap-3 mb-6">
                  <Badge className="bg-primary text-white border-none rounded-lg px-4 py-1 font-black uppercase tracking-widest">
                    {item.category}
                  </Badge>
                  <Badge className="bg-secondary text-white border-none rounded-lg px-4 py-1 font-black uppercase tracking-widest">
                    Year {item.year}
                  </Badge>
                  {item.solved ? (
                    <Badge className="bg-green-500 text-white border-none rounded-lg px-4 py-1 font-black uppercase tracking-widest">
                      Solved
                    </Badge>
                  ) : null}
                </div>
                <h1 className="text-3xl md:text-5xl font-black mb-8 tracking-tight leading-tight">{item.title}</h1>
              </div>
            </div>

            <CardContent className="p-8 md:p-12">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2 space-y-10">
                  <section>
                    <h2 className="text-2xl font-black mb-4 tracking-tight">Overview</h2>
                    <p className="text-muted-foreground leading-relaxed text-lg whitespace-pre-wrap">
                      {item.description || 'No description added yet. Check back later.'}
                    </p>
                  </section>
                </div>

                <div className="lg:col-span-1 space-y-8">
                  <div className="space-y-4">
                    {item.pdfUrl ? (
                      <a href={item.pdfUrl} target="_blank" rel="noopener noreferrer" className="block">
                        <Button className="w-full h-16 rounded-2xl font-black text-lg shadow-xl shadow-primary/20">
                          <Download className="mr-2 w-6 h-6" /> Open PDF / resource
                        </Button>
                      </a>
                    ) : (
                      <Button className="w-full h-16 rounded-2xl font-black text-lg shadow-xl shadow-primary/20" disabled>
                        PDF not linked yet
                      </Button>
                    )}
                  </div>

                  <div className="p-8 rounded-3xl border border-border/50 bg-card">
                    <h3 className="font-black mb-6 uppercase tracking-widest text-xs text-muted-foreground">
                      Share question set
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <Button variant="outline" className="rounded-xl h-12" onClick={() => handleShare('facebook')}>
                        <Facebook className="w-5 h-5" />
                      </Button>
                      <Button variant="outline" className="rounded-xl h-12" onClick={() => handleShare('twitter')}>
                        <Twitter className="w-5 h-5" />
                      </Button>
                      <Button variant="outline" className="rounded-xl h-12" onClick={() => handleShare('linkedin')}>
                        <Linkedin className="w-5 h-5" />
                      </Button>
                      <Button variant="outline" className="rounded-xl h-12" onClick={() => handleShare('copy')}>
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

export default QuestionDetails;
