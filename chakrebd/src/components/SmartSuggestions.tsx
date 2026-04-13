'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { Sparkles, ArrowRight, Lightbulb } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from './LanguageContext';
import { useLocation } from '@/lib/locationContext';
import { ThreeDCard } from './ThreeDCard';
import { listSuggestionsApi, type ApiSuggestionListItem } from '@/lib/api';

const SmartSuggestions = () => {
  const { t } = useLanguage();
  const { countryCode } = useLocation();
  const [items, setItems] = useState<ApiSuggestionListItem[]>([]);

  useEffect(() => {
    listSuggestionsApi({ country: countryCode, limit: 6 }).then((r) => {
      if (r.ok) setItems(r.suggestions);
    });
  }, [countryCode]);

  return (
    <section id="suggestions" className="py-24 bg-muted/20 relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6">
          <div className="text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-xs font-bold mb-4 uppercase tracking-widest border border-primary/20">
              <Sparkles className="w-4 h-4" />
              <span>{t('smart.title')}</span>
            </div>
            <h2 className="text-4xl font-bold mb-2">{t('smart.title')}</h2>
            <p className="text-muted-foreground max-w-lg">{t('smart.subtitle')}</p>
          </div>
          <Link
            href={`/suggestions?country=${countryCode}`}
            className="inline-flex items-center gap-2 text-sm font-black text-primary hover:underline"
          >
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.length === 0 ? (
            <p className="text-muted-foreground col-span-full text-center py-8">{t('featured.noSuggestions')}</p>
          ) : (
            items.map((s, i) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
              >
                <ThreeDCard>
                  <Link href={`/suggestions/${s.id}`}>
                    <Card className="h-full border-border/50 hover:shadow-lg transition-all rounded-[2rem] overflow-hidden bg-card/80">
                      <CardHeader>
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                            <Lightbulb className="w-6 h-6 text-primary" />
                          </div>
                          <Badge variant="secondary" className="text-[10px] font-black uppercase">
                            {s.category}
                          </Badge>
                        </div>
                        <CardTitle className="text-lg leading-snug line-clamp-2 hover:text-primary transition-colors">
                          {s.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground line-clamp-2">{s.summary}</p>
                      </CardContent>
                    </Card>
                  </Link>
                </ThreeDCard>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </section>
  );
};

export default SmartSuggestions;
