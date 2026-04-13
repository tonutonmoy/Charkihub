'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { Search, Database, Share2, ArrowRight, History } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ThreeDCard } from '../components/ThreeDCard';
import { listQBankItems, type ApiQBankItem } from '@/lib/api';
import { useLocation } from '@/lib/locationContext';

const QuestionBank = () => {
  const { countryCode } = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [items, setItems] = useState<ApiQBankItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    listQBankItems({ country: countryCode, search: searchTerm.trim() || undefined }).then((r) => {
      if (r.ok) setItems(r.items);
      setLoading(false);
    });
  }, [countryCode, searchTerm]);

  const categories = ['All', ...Array.from(new Set(items.map((i) => i.category))).sort()];
  const filteredQuestions = items.filter((item) => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesCategory;
  });

  return (
    <div className="pt-32 pb-20 min-h-screen bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-xs font-bold mb-4 uppercase tracking-widest border border-primary/20">
            <History className="w-4 h-4" />
            <span>Archive</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">প্রশ্ন ব্যাংক (Question Bank)</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Access a vast collection of previous years&apos; exam questions with detailed solutions.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-12 bg-card p-6 rounded-[2rem] shadow-xl shadow-primary/5 border border-border/50">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              placeholder="Search previous questions..."
              className="pl-12 h-14 rounded-xl border-border/50 focus-visible:ring-primary/30"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? 'default' : 'outline'}
                className="rounded-xl h-14 px-6 font-bold whitespace-nowrap"
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>

        {loading ? (
          <p className="text-center text-muted-foreground py-12">Loading…</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredQuestions.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <ThreeDCard>
                  <Link href={`/qbank/${item.id}`}>
                    <Card className="h-full hover:shadow-2xl transition-all duration-500 border-border/50 group bg-card/80 backdrop-blur-sm rounded-[2rem] overflow-hidden">
                      <CardHeader className="pb-4">
                        <div className="flex justify-between items-start mb-6">
                          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                            <Database className="w-7 h-7 text-primary" />
                          </div>
                          <Badge
                            variant={item.solved ? 'default' : 'secondary'}
                            className="rounded-lg px-3 py-1 font-black text-[10px] uppercase tracking-widest border-none"
                          >
                            {item.solved ? 'Solved' : 'Unsolved'}
                          </Badge>
                        </div>
                        <CardTitle className="text-xl font-black group-hover:text-primary transition-colors leading-tight">
                          {item.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-bold text-muted-foreground">Year: {item.year}</p>
                          <Badge variant="outline" className="font-bold border-primary/20 text-primary">
                            {item.category}
                          </Badge>
                        </div>
                        <div className="pt-4 flex items-center justify-between border-t border-border/50">
                          <span className="text-xs font-black text-primary uppercase tracking-widest flex items-center gap-1">
                            View details <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          </span>
                          <div className="flex gap-2">
                            <Button size="icon" variant="ghost" className="rounded-full w-10 h-10">
                              <Share2 className="w-5 h-5" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </ThreeDCard>
              </motion.div>
            ))}
          </div>
        )}
        {!loading && filteredQuestions.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">No questions match your filters.</p>
        ) : null}
      </div>
    </div>
  );
};

export default QuestionBank;
