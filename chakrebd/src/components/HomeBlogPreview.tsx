'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from './LanguageContext';
import { useLocation } from '@/lib/locationContext';
import { listBlogPosts, type ApiBlogListItem } from '@/lib/api';

export default function HomeBlogPreview() {
  const { t } = useLanguage();
  const { countryCode } = useLocation();
  const [posts, setPosts] = useState<ApiBlogListItem[]>([]);

  useEffect(() => {
    listBlogPosts({ country: countryCode, limit: 3 }).then((r) => {
      if (r.ok) setPosts(r.posts);
    });
  }, [countryCode]);

  return (
    <section id="blog" className="py-24 bg-muted/20">
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
          <div>
            <h2 className="text-3xl font-bold mb-2">{t('nav.blog')}</h2>
            <p className="text-muted-foreground max-w-xl">{t('blog.sectionSubtitle')}</p>
          </div>
          <Link
            href="/blog"
            className="inline-flex items-center text-sm font-bold text-primary hover:underline group rounded-xl px-2 py-2"
          >
            {t('blog.viewAll')}
            <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {posts.length === 0 ? (
            <p className="text-muted-foreground col-span-full text-center py-8">{t('blog.empty')}</p>
          ) : (
            posts.map((post, i) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <Link href={`/blog/${post.id}`}>
                  <Card className="h-full overflow-hidden border-border/50 hover:shadow-xl transition-all rounded-[2rem]">
                    <div className="aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                      <span className="text-4xl font-black text-primary/40">{post.countryCode}</span>
                    </div>
                    <CardHeader>
                      <Badge variant="secondary" className="text-[10px] uppercase tracking-wider w-fit mb-2">
                        {post.category}
                      </Badge>
                      <CardTitle className="text-lg leading-snug hover:text-primary transition-colors line-clamp-2">
                        {post.title}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-2">{post.excerpt}</p>
                    </CardHeader>
                  </Card>
                </Link>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
