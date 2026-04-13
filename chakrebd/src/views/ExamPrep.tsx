'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { Search, BookOpen, Clock, ArrowRight, PlayCircle, Download } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ThreeDCard } from '../components/ThreeDCard';
import { useLocation } from '@/lib/locationContext';
import { fetchExamPrepCategories, fetchExamPrepCourses, type ApiExamPrepCourse } from '@/lib/api';

const ExamPrep = () => {
  const { countryCode } = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [debounced, setDebounced] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | 'all'>('all');
  const [categories, setCategories] = useState<{ id: string; label: string; slug: string }[]>([]);
  const [courses, setCourses] = useState<ApiExamPrepCourse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(searchTerm.trim()), 350);
    return () => clearTimeout(t);
  }, [searchTerm]);

  useEffect(() => {
    let cancelled = false;
    fetchExamPrepCategories(countryCode).then((r) => {
      if (cancelled || !r.ok) return;
      setCategories(r.categories);
    });
    return () => {
      cancelled = true;
    };
  }, [countryCode]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchExamPrepCourses({
      country: countryCode,
      categoryId: selectedCategoryId === 'all' ? undefined : selectedCategoryId,
      search: debounced || undefined,
    }).then((r) => {
      if (cancelled) return;
      if (r.ok) setCourses(r.courses);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [countryCode, selectedCategoryId, debounced]);

  const filterButtons = useMemo(() => {
    return [{ id: 'all' as const, label: 'All' }, ...categories.map((c) => ({ id: c.id, label: c.label }))];
  }, [categories]);

  return (
    <div className="pt-32 pb-20 min-h-screen bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">পরীক্ষা প্রস্তুতি (Exam Prep)</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Categories and courses are managed in admin — filtered for <strong>{countryCode}</strong>.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-12 bg-card p-6 rounded-[2rem] shadow-xl shadow-primary/5 border border-border/50">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              placeholder="Search courses..."
              className="pl-12 h-14 rounded-xl border-border/50 focus-visible:ring-primary/30"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
            {filterButtons.map((cat) => (
              <Button
                key={cat.id}
                variant={selectedCategoryId === cat.id ? 'default' : 'outline'}
                className="rounded-xl h-14 px-6 font-bold whitespace-nowrap"
                onClick={() => setSelectedCategoryId(cat.id)}
              >
                {cat.label}
              </Button>
            ))}
          </div>
        </div>

        {loading ? (
          <p className="text-center text-muted-foreground py-12">Loading courses…</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <ThreeDCard>
                  <Link href={`/prep/${item.id}`}>
                    <Card className="h-full hover:shadow-2xl transition-all duration-500 border-border/50 group bg-card/80 backdrop-blur-sm rounded-[2rem] overflow-hidden">
                      <div className="aspect-video relative overflow-hidden">
                        <img
                          src={`https://picsum.photos/seed/prep${item.id}/800/450`}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <PlayCircle className="w-16 h-16 text-white" />
                        </div>
                        <Badge className="absolute top-4 right-4 bg-primary text-white font-black uppercase tracking-widest border-none">
                          {item.price}
                        </Badge>
                      </div>
                      <CardHeader className="pb-4">
                        <Badge
                          variant="secondary"
                          className="w-fit rounded-lg px-3 py-1 font-black text-[10px] uppercase tracking-widest mb-2"
                        >
                          {item.category.label}
                        </Badge>
                        <CardTitle className="text-xl font-black group-hover:text-primary transition-colors leading-tight">
                          {item.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="flex items-center justify-between text-sm font-bold text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-primary" />
                            {item.lessons} Lessons
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-secondary" />
                            {item.duration}
                          </div>
                        </div>
                        <div className="pt-4 flex items-center justify-between border-t border-border/50">
                          <span className="text-xs font-black text-primary uppercase tracking-widest flex items-center gap-1">
                            Start Learning <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          </span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="rounded-full w-10 h-10 hover:bg-primary/10 hover:text-primary"
                          >
                            <Download className="w-5 h-5" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </ThreeDCard>
              </motion.div>
            ))}
          </div>
        )}

        {!loading && courses.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">No courses for this filter yet.</p>
        ) : null}
      </div>
    </div>
  );
};

export default ExamPrep;
