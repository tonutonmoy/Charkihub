'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import {
  Briefcase,
  Building2,
  MapPin,
  Lightbulb,
  ArrowUpRight,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from './LanguageContext';
import { useLocation } from '@/lib/locationContext';
import { ThreeDCard } from './ThreeDCard';
import { listJobs, listSuggestionsApi, type ApiJobListItem, type ApiSuggestionListItem } from '@/lib/api';

type Column = {
  id: string;
  title: string;
  icon: React.ElementType;
  color: string;
  href: string;
  items: { title: string; meta: string; extra?: string }[];
};

export default function FeaturedGrid() {
  const { t } = useLanguage();
  const { countryCode } = useLocation();
  const [govt, setGovt] = useState<ApiJobListItem[]>([]);
  const [priv, setPriv] = useState<ApiJobListItem[]>([]);
  const [local, setLocal] = useState<ApiJobListItem[]>([]);
  const [sugs, setSugs] = useState<ApiSuggestionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    Promise.all([
      listJobs({ country: countryCode, mainCategory: 'government', limit: 3 }),
      listJobs({ country: countryCode, mainCategory: 'private', limit: 3 }),
      listJobs({ country: countryCode, mainCategory: 'local', limit: 3 }),
      listSuggestionsApi({ country: countryCode, limit: 3 }),
    ]).then(([a, b, c, d]) => {
      if (cancelled) return;
      if (!a.ok && !b.ok && !c.ok && !d.ok) {
        const err = [a, b, c, d].find((x) => !x.ok);
        setLoadError(err && 'error' in err ? err.error : t('common.apiError'));
      } else {
        setLoadError(null);
      }
      if (a.ok) setGovt(a.jobs);
      if (b.ok) setPriv(b.jobs);
      if (c.ok) setLocal(c.jobs);
      if (d.ok) setSugs(d.suggestions);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [countryCode, t]);

  const toItems = (
    jobs: ApiJobListItem[],
    emptyLabel: string
  ): { title: string; meta: string; extra?: string }[] => {
    if (!jobs.length) return [{ title: emptyLabel, meta: '—', extra: undefined }];
    return jobs.map((j) => ({
      title: j.title,
      meta: j.organization,
      extra: new Date(j.endAt).toLocaleDateString(),
    }));
  };

  const sugItems: { title: string; meta: string; extra?: string }[] =
    sugs.length === 0
      ? [{ title: t('featured.noSuggestions'), meta: '—' }]
      : sugs.map((s) => ({
          title: s.title,
          meta: s.category,
          extra: s.summary.slice(0, 40) + (s.summary.length > 40 ? '…' : ''),
        }));

  const features: Column[] = [
    {
      id: 'gov',
      title: t('featured.colGov'),
      icon: Briefcase,
      color: 'bg-blue-500',
      href: `/jobs?country=${countryCode}&mainCategory=government`,
      items: toItems(govt, t('featured.noJobs')),
    },
    {
      id: 'private',
      title: t('featured.colPrivate'),
      icon: Building2,
      color: 'bg-emerald-500',
      href: `/jobs?country=${countryCode}&mainCategory=private`,
      items: toItems(priv, t('featured.noJobs')),
    },
    {
      id: 'local',
      title: t('featured.colLocal'),
      icon: MapPin,
      color: 'bg-amber-500',
      href: `/jobs?country=${countryCode}&mainCategory=local`,
      items: toItems(local, t('featured.noLocal')),
    },
    {
      id: 'suggestions',
      title: t('featured.suggestions'),
      icon: Lightbulb,
      color: 'bg-yellow-500',
      href: `/suggestions?country=${countryCode}`,
      items: sugItems,
    },
  ];

  return (
    <section id="explore" className="py-24 bg-muted/30 relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-4 uppercase tracking-widest">
            <Sparkles className="w-4 h-4" />
            <span>{t('featured.badge')}</span>
          </div>
          <h2 className="text-4xl font-bold mb-4">{t('featured.title')}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">{t('featured.subtitle')}</p>
          {loadError ? (
            <p className="mt-4 text-sm text-destructive font-medium max-w-xl mx-auto">{loadError}</p>
          ) : null}
          {loading ? (
            <p className="mt-4 text-sm text-muted-foreground">{t('jobs.loading')}</p>
          ) : null}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, idx) => (
            <motion.div
              key={feature.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.08, duration: 0.5 }}
            >
              <ThreeDCard>
                <Link href={feature.href}>
                  <Card className="h-full hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] transition-all duration-500 border-border/50 group cursor-pointer overflow-hidden bg-card/80 backdrop-blur-sm rounded-[2rem]">
                    <CardHeader className="pb-6">
                      <div
                        className={`w-14 h-14 rounded-2xl ${feature.color}/15 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500`}
                      >
                        <feature.icon className="w-7 h-7 text-foreground" />
                      </div>
                      <CardTitle className="text-xl flex items-center justify-between font-bold">
                        {feature.title}
                        <ArrowUpRight className="w-5 h-5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all shrink-0" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {feature.items.map((item, i) => (
                        <div key={i} className="group/item">
                          <p className="text-sm font-bold group-hover/item:text-primary transition-colors line-clamp-2">
                            {item.title}
                          </p>
                          <div className="flex items-center justify-between mt-2 gap-2">
                            <span className="text-xs text-muted-foreground font-medium line-clamp-1">{item.meta}</span>
                            {item.extra ? (
                              <Badge
                                variant="outline"
                                className="text-[10px] h-5 px-2 shrink-0 border-primary/20 font-bold"
                              >
                                <Clock className="w-3 h-3 mr-1" />
                                {item.extra}
                              </Badge>
                            ) : null}
                          </div>
                          {i < feature.items.length - 1 && <div className="h-px bg-border/30 mt-6" />}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </Link>
              </ThreeDCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
