'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { ArrowRight, Heart, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useLocation } from '@/lib/locationContext';
import { useLanguage } from './LanguageContext';
import { topRatedJobs, type ApiJobListItem } from '@/lib/api';

function JobRow({ job }: { job: ApiJobListItem }) {

  console.log(job)
  const end = new Date(job.endAt);
  return (
    <Link
      href={`/jobs/${job.id}`}
      className="block p-4 rounded-2xl border border-border/50 bg-card/60 hover:bg-muted/40 transition-colors"
    >
      <div className="flex justify-between gap-3 items-start">
        <div>
          <p className="font-bold line-clamp-2">{job.title}</p>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{job.organization}</p>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge variant="secondary" className="text-[10px]">
              {job.subCategory}
            </Badge>
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {job.countryCode}
            </span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <span className="text-xs font-bold text-primary flex items-center justify-end gap-1">
            <Heart className="w-3 h-3" />
            {job.likeCount}
          </span>
          <p className="text-[10px] text-muted-foreground mt-1">Until {end.toLocaleDateString()}</p>
        </div>
      </div>
    </Link>
  );
}

export default function HomeJobSections() {
  const { countryCode, countryName } = useLocation();
  const { t } = useLanguage();
  const [rated, setRated] = useState<ApiJobListItem[]>([]);
  const [govt, setGovt] = useState<ApiJobListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    Promise.all([
      topRatedJobs({ country: countryCode, limit: 6 }),
      topRatedJobs({ country: countryCode, mainCategory: 'government', limit: 6 }),
    ]).then(([r1, r2]) => {
      if (cancelled) return;
      if (!r1.ok && !r2.ok) {
        const err = !r1.ok ? r1 : r2;
        setLoadError('error' in err ? err.error : t('common.apiError'));
      }
      if (r1.ok) setRated(r1.jobs);
      if (r2.ok) setGovt(r2.jobs);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [countryCode, t]);

  if (loading && !rated.length && !govt.length) {
    return (
      <section className="py-16 bg-muted/20">
        <div className="container mx-auto px-4">
          <p className="text-center text-muted-foreground">{t('jobs.loading')}</p>
        </div>
      </section>
    );
  }


  console.log(govt)
  return (
    <section className="py-20 bg-muted/20 border-y border-border/40">
      <div className="container mx-auto px-4 space-y-16">
        {loadError ? (
          <p className="text-center text-sm text-destructive font-medium">{loadError}</p>
        ) : null}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <h2 className="text-3xl font-black tracking-tight">
                Top rated jobs — {countryName}
              </h2>
              <p className="text-muted-foreground mt-2 max-w-xl">
                Most liked openings in your selected country (likes from signed-in users).
              </p>
            </div>
            <Link
              href={`/jobs?country=${countryCode}`}
              className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'rounded-xl font-bold shrink-0 h-11 px-6')}
            >
              View all <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>
          <Card className="rounded-[2rem] border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Popular this week</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-3">
              {rated.length === 0 ? (
                <p className="text-sm text-muted-foreground col-span-full">No jobs yet — check back soon.</p>
              ) : (
                rated.map((j) => <JobRow key={j.id} job={j} />)
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <h2 className="text-3xl font-black tracking-tight">
                Top government jobs — {countryName}
              </h2>
              <p className="text-muted-foreground mt-2 max-w-xl">
                Public sector circulars filtered for your location.
              </p>
            </div>
            <Link
              href={`/jobs?country=${countryCode}&mainCategory=government`}
              className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'rounded-xl font-bold shrink-0 h-11 px-6')}
            >
              View all <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>
          <Card className="rounded-[2rem] border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Government</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-3">
              {govt.length === 0 ? (
                <p className="text-sm text-muted-foreground col-span-full">No government jobs listed yet.</p>
              ) : (
                govt.map((j) => <JobRow key={j.id} job={j} />)
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
