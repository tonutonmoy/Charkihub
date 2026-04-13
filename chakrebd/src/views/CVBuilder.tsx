'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, Palette, Zap, Sparkles, ArrowRight, Eye, Copy, Share2, Check } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ThreeDCard } from '../components/ThreeDCard';
import { CV_TEMPLATE_LIST, CV_CATEGORIES } from '@/lib/cv/templateMeta';

const CVBuilder = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showCopyPopup, setShowCopyPopup] = useState(false);

  const filteredTemplates = CV_TEMPLATE_LIST.filter(
    (t) => selectedCategory === 'All' || t.category === selectedCategory
  );

  const handleCopy = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setShowCopyPopup(true);
      setTimeout(() => setShowCopyPopup(false), 2000);
    }
  };

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
            লিঙ্ক কপি হয়েছে!
          </motion.div>
        )}
      </AnimatePresence>

      <div className="container mx-auto px-4">
        <div className="text-center mb-20">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-xs font-bold mb-6 uppercase tracking-widest border border-primary/20">
              <Sparkles className="w-4 h-4" />
              <span>স্মার্ট সিভি বিল্ডার</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight">
              বাংলাদেশের সেরা <span className="text-primary">সিভি টেমপ্লেট</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              বাংলাদেশি চাকরি বাজারের জন্য তৈরি ATS-ফ্রেন্ডলি টেমপ্লেট — সম্পাদনা করে PDF ডাউনলোড করুন।
            </p>
          </motion.div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 mb-12">
          {CV_CATEGORIES.map((cat) => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? 'default' : 'outline'}
              className="rounded-xl h-12 px-6 font-bold transition-all"
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-24">
          {filteredTemplates.map((template, i) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <ThreeDCard>
                <Card className="h-full border-border/50 bg-card rounded-[2.5rem] overflow-hidden group hover:shadow-2xl transition-all duration-500">
                  <div className="aspect-[3/4] relative overflow-hidden bg-muted">
                    {/* ইমেজে ক্লিক/ট্যাপ = সম্পাদক (ওভারলে অদৃশ্য থাকলেও ক্লিক ব্লক করে না) */}
                    <Link
                      href={`/cv/edit/${template.id}`}
                      className="absolute inset-0 z-[1] block outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-t-[2.5rem]"
                      aria-label={`${template.name} — সম্পাদনা`}
                    >
                      <Image
                        src={template.image}
                        alt=""
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                        sizes="(max-width: 768px) 100vw, 25vw"
                        referrerPolicy="no-referrer"
                      />
                    </Link>
                    {/* হোভারে বাটন; pointer-events খোলা না থাকলে অদৃশ্য লেয়ার ক্লিক খেয়ে ফেলে */}
                    <div className="absolute inset-0 z-[2] flex flex-col items-center justify-center p-6 gap-4 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto">
                      <Link
                        href={`/cv/edit/${template.id}`}
                        className={cn(
                          buttonVariants({ variant: 'default' }),
                          'w-full pointer-events-auto min-h-12 rounded-xl font-black h-12 shadow-lg shadow-primary/20 justify-center'
                        )}
                      >
                        এই টেমপ্লেট ব্যবহার করুন
                      </Link>
                      <Link
                        href={`/cv/edit/${template.id}?mode=preview`}
                        className={cn(
                          buttonVariants({ variant: 'outline' }),
                          'w-full pointer-events-auto min-h-12 rounded-xl font-black h-12 border-white/20 bg-white/10 text-white hover:bg-white/20 justify-center'
                        )}
                      >
                        <Eye className="mr-2 w-5 h-5" /> প্রিভিউ
                      </Link>
                    </div>
                    {template.popular && (
                      <Badge className="absolute top-4 left-4 bg-secondary text-white font-black uppercase tracking-widest border-none">
                        সবচেয়ে বেশি ব্যবহৃত
                      </Badge>
                    )}
                  </div>
                  <CardHeader className="p-6">
                    <Badge
                      variant="secondary"
                      className="w-fit rounded-lg px-3 py-1 font-black text-[10px] uppercase tracking-widest mb-2 bg-primary/10 text-primary border-none"
                    >
                      {template.category}
                    </Badge>
                    <Link href={`/cv/edit/${template.id}`} className="block hover:text-primary transition-colors">
                      <CardTitle className="text-xl font-black">{template.name}</CardTitle>
                    </Link>
                    <p className="text-sm text-muted-foreground font-medium line-clamp-2 mt-2">{template.desc}</p>
                  </CardHeader>
                  <div className="px-6 pb-6 flex items-center justify-between border-t border-border/50 pt-4">
                    <div className="flex gap-2">
                      <Button size="icon" variant="ghost" className="rounded-full w-9 h-9" onClick={handleCopy}>
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="rounded-full w-9 h-9" type="button">
                        <Share2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <Link
                      href={`/cv/edit/${template.id}`}
                      className={cn(
                        buttonVariants({ variant: 'ghost', size: 'sm' }),
                        'font-black text-primary uppercase tracking-widest text-[10px] inline-flex items-center group/btn'
                      )}
                    >
                      বিস্তারিত <ArrowRight className="ml-1 w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </Card>
              </ThreeDCard>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-24">
          {[
            { title: 'ATS Friendly', icon: Zap, desc: 'স্বয়ংক্রিয় স্ক্রিনিং সিস্টেমের জন্য উপযোগী।' },
            { title: 'PDF এক্সপোর্ট', icon: Download, desc: 'প্রিন্টের জন্য পরিষ্কার PDF।' },
            { title: 'সহজ সম্পাদনা', icon: Palette, desc: 'যেকোনো সময় তথ্য আপডেট করুন।' },
          ].map((feature, i) => (
            <div key={i} className="flex flex-col items-center text-center p-8 rounded-[2.5rem] bg-card border border-border/50 shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                <feature.icon className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-black mb-3 tracking-tight">{feature.title}</h3>
              <p className="text-muted-foreground font-medium">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CVBuilder;
