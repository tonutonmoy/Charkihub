'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion } from 'motion/react';
import { Search, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ThreeDCard } from '../components/ThreeDCard';
import { useLocation } from '@/lib/locationContext';
import { getCountryName } from '@/lib/countries';
import { listBlogPosts, type ApiBlogListItem } from '@/lib/api';

const BlogPage = () => {
  const searchParams = useSearchParams();
  const { countryCode, setCountryCode } = useLocation();
  const urlCountry = searchParams.get('country');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [posts, setPosts] = useState<ApiBlogListItem[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<string[]>(['All']);
  const [loading, setLoading] = useState(true);

  const effectiveCountry = urlCountry && /^[A-Z]{2}$/i.test(urlCountry) ? urlCountry.toUpperCase() : countryCode;

  useEffect(() => {
    listBlogPosts({ country: effectiveCountry, limit: 200 }).then((r) => {
      if (r.ok) {
        const u = ['All', ...Array.from(new Set(r.posts.map((p) => p.category))).sort()];
        setCategoryOptions(u);
      }
    });
  }, [effectiveCountry]);

  useEffect(() => {
    if (urlCountry && /^[A-Z]{2}$/i.test(urlCountry)) {
      setCountryCode(urlCountry.toUpperCase());
    }
  }, [urlCountry, setCountryCode]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listBlogPosts({
      country: effectiveCountry,
      category: selectedCategory === 'All' ? undefined : selectedCategory,
      search: searchTerm.trim() || undefined,
      limit: 48,
    }).then((r) => {
      if (cancelled) return;
      if (r.ok) setPosts(r.posts);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [effectiveCountry, selectedCategory, searchTerm]);

  return (
    <div className="pt-32 pb-20 min-h-screen bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">ব্লগ · Blog</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {getCountryName(effectiveCountry)} — filter by category; admin posts from your region.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-10 bg-card p-6 rounded-[2rem] shadow-xl shadow-primary/5 border border-border/50">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              placeholder="Search posts..."
              className="pl-12 h-14 rounded-xl border-border/50 focus-visible:ring-primary/30"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar flex-wrap">
            {categoryOptions.map((cat) => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? 'default' : 'outline'}
                className="rounded-xl h-12 px-4 font-bold whitespace-nowrap"
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>

        {loading ? (
          <p className="text-center text-muted-foreground py-20">Loading…</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <ThreeDCard>
                  <Link href={`/blog/${item.id}`}>
                    <Card className="h-full hover:shadow-2xl transition-all duration-500 border-border/50 group bg-card/80 backdrop-blur-sm rounded-[2rem] overflow-hidden">
                      <div className="aspect-[16/10] bg-gradient-to-br from-primary/25 to-secondary/20 flex items-center justify-center">
                        <span className="text-5xl font-black text-primary/30">{item.countryCode}</span>
                      </div>
                      <CardHeader className="pb-4">
                        <div className="flex items-center gap-2 mb-4">
                          <Badge
                            variant="secondary"
                            className="rounded-lg px-3 py-1 font-black text-[10px] uppercase tracking-widest bg-primary/10 text-primary border-none"
                          >
                            {item.category}
                          </Badge>
                          <span className="text-xs text-muted-foreground font-bold">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <CardTitle className="text-xl font-black group-hover:text-primary transition-colors leading-tight line-clamp-2">
                          {item.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground line-clamp-3 mb-4">{item.excerpt}</p>
                        <span className="text-xs font-black text-primary uppercase tracking-widest flex items-center gap-1">
                          Read <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </span>
                      </CardContent>
                    </Card>
                  </Link>
                </ThreeDCard>
              </motion.div>
            ))}
          </div>
        )}

        {!loading && posts.length === 0 && (
          <p className="text-center text-muted-foreground py-20 font-bold">No posts for these filters.</p>
        )}
      </div>
    </div>
  );
};

export default BlogPage;
