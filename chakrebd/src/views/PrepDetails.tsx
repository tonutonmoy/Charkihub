'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Download,
  PlayCircle,
  BookOpen,
  Clock,
  CheckCircle2,
  Star,
  Facebook,
  Twitter,
  Linkedin,
  Link as LinkIcon,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { fetchExamPrepCourse } from '@/lib/api';

const PrepDetails = () => {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const [showCopyPopup, setShowCopyPopup] = useState(false);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [item, setItem] = useState<{
    id: string;
    title: string;
    description: string | null;
    lessons: number;
    duration: string;
    rating: number;
    price: string;
    category: { label: string };
  } | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchExamPrepCourse(id).then((r) => {
      setLoading(false);
      if (!r.ok) {
        setErr(r.error);
        return;
      }
      setItem(r.course);
    });
  }, [id]);

  const handleShare = (platform: string) => {
    if (!item) return;
    const url = window.location.href;
    if (platform === 'copy') {
      navigator.clipboard.writeText(url);
      setShowCopyPopup(true);
      setTimeout(() => setShowCopyPopup(false), 2000);
    } else {
      const text = `Check out this course: ${item.title}`;
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

  if (err || !item) {
    return (
      <div className="pt-32 pb-20 min-h-screen container px-4 text-center">
        <p className="text-destructive mb-4">{err || 'Not found'}</p>
        <Button variant="ghost" onClick={() => router.push('/prep')}>
          Back to Prep
        </Button>
      </div>
    );
  }

  let modules =
    item.description
      ?.split(/\n+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 12) || [];
  if (modules.length === 0) {
    modules = ['Structured lessons and materials (see overview).'];
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
            Link copied to clipboard!
          </motion.div>
        )}
      </AnimatePresence>

      <div className="container mx-auto px-4 max-w-4xl">
        <Button
          variant="ghost"
          className="mb-8 font-bold hover:bg-primary/10 hover:text-primary transition-all rounded-xl"
          onClick={() => router.push('/prep')}
        >
          <ArrowLeft className="mr-2 w-5 h-5" /> Back to Prep
        </Button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="rounded-[2.5rem] overflow-hidden border-border/50 shadow-2xl shadow-primary/5 bg-card">
            <div className="aspect-video relative overflow-hidden group">
              <img
                src={`https://picsum.photos/seed/prep${item.id}/1200/675`}
                alt={item.title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <Button
                  size="lg"
                  className="h-20 w-20 rounded-full bg-white/20 backdrop-blur-xl border-2 border-white/30 hover:scale-110 transition-transform group"
                >
                  <PlayCircle className="w-10 h-10 text-white fill-white" />
                </Button>
              </div>
              <Badge className="absolute top-8 right-8 bg-primary text-white font-black uppercase tracking-widest border-none px-6 py-2 text-lg">
                {item.price}
              </Badge>
            </div>

            <CardContent className="p-8 md:p-12">
              <div className="flex flex-wrap gap-3 mb-8">
                <Badge className="bg-primary/10 text-primary border-none rounded-lg px-4 py-1 font-black uppercase tracking-widest">
                  {item.category.label}
                </Badge>
                <div className="flex items-center gap-1 text-secondary font-black ml-auto">
                  <Star className="w-5 h-5 fill-secondary" />
                  {item.rating} Rating
                </div>
              </div>

              <h1 className="text-3xl md:text-5xl font-black mb-8 tracking-tight leading-tight">{item.title}</h1>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2 space-y-10">
                  <section>
                    <h2 className="text-2xl font-black mb-4 tracking-tight">Course Overview</h2>
                    <p className="text-muted-foreground leading-relaxed text-lg whitespace-pre-wrap">
                      {item.description || 'Course details will appear here.'}
                    </p>
                  </section>

                  <section>
                    <h2 className="text-2xl font-black mb-4 tracking-tight">Highlights</h2>
                    <ul className="space-y-4">
                      {modules.map((mod, i) => (
                        <li key={i} className="flex items-start gap-3 text-muted-foreground">
                          <CheckCircle2 className="w-6 h-6 text-primary shrink-0 mt-0.5" />
                          <span className="text-lg font-bold">{mod}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                </div>

                <div className="lg:col-span-1 space-y-8">
                  <div className="p-8 rounded-3xl bg-muted/50 border border-border/50 space-y-6">
                    <div className="flex items-center justify-between font-bold">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <BookOpen className="w-5 h-5 text-primary" />
                        Lessons
                      </div>
                      <span>{item.lessons}</span>
                    </div>
                    <div className="flex items-center justify-between font-bold">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="w-5 h-5 text-secondary" />
                        Duration
                      </div>
                      <span>{item.duration}</span>
                    </div>
                    <Button className="w-full h-16 rounded-2xl font-black text-lg shadow-xl shadow-primary/20">
                      <Download className="w-5 h-5 mr-2" /> Enroll
                    </Button>
                  </div>

                  <div className="p-8 rounded-3xl border border-border/50 bg-card">
                    <h3 className="font-black mb-6 uppercase tracking-widest text-xs text-muted-foreground">
                      Share Course
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

export default PrepDetails;
