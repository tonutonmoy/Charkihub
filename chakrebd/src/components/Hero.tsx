'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Search, ArrowRight, CheckCircle2, Star, Sparkles, MapPin } from 'lucide-react';
import { useLanguage } from './LanguageContext';
import { ThreeDCard } from './ThreeDCard';
import { useLocation } from '@/lib/locationContext';
import { cn } from '@/lib/utils';
import { COUNTRY_OPTIONS } from '@/lib/countries';

const Hero = () => {
  const { t } = useLanguage();
  const { countryCode, countryName, setCountryCode } = useLocation();

  const jobLinks = (main: 'government' | 'private' | 'local') =>
    `/jobs?country=${countryCode}&mainCategory=${main}`;

  return (
    <section className="relative pt-32 pb-20 overflow-hidden perspective-1000">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full animate-pulse-slow" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/10 blur-[120px] rounded-full animate-pulse-slow" />
        <motion.div
          animate={{ y: [0, -20, 0], rotate: [0, 10, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/4 right-1/4 w-24 h-24 bg-primary/20 rounded-2xl blur-xl"
        />
      </div>

      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            >
              <div className="inline-flex flex-wrap items-center justify-center lg:justify-start gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-xs font-bold mb-6 uppercase tracking-widest border border-primary/20 shadow-sm">
                <Sparkles className="w-4 h-4 fill-primary" />
                <span>{t('hero.badge')}</span>
                <span className="hidden sm:inline opacity-40">|</span>
                <span className="inline-flex items-center gap-1 font-black">
                  <MapPin className="w-3.5 h-3.5" />
                  {countryName} ({countryCode})
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] mb-6 tracking-tight">
                {t('hero.titleWW')}
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                {t('hero.subtitleWW')}
              </p>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 mb-8">
                <Link
                  href={jobLinks('government')}
                  className={cn(
                    buttonVariants({ variant: 'secondary', size: 'sm' }),
                    'rounded-full font-bold'
                  )}
                >
                  {t('hero.chipGov')}
                </Link>
                <Link
                  href={jobLinks('private')}
                  className={cn(
                    buttonVariants({ variant: 'secondary', size: 'sm' }),
                    'rounded-full font-bold'
                  )}
                >
                  {t('hero.chipPrivate')}
                </Link>
                <Link
                  href={jobLinks('local')}
                  className={cn(
                    buttonVariants({ variant: 'secondary', size: 'sm' }),
                    'rounded-full font-bold'
                  )}
                >
                  {t('hero.chipLocal')}
                </Link>
                <Link
                  href={`/suggestions?country=${countryCode}`}
                  className={cn(
                    buttonVariants({ variant: 'outline', size: 'sm' }),
                    'rounded-full font-bold'
                  )}
                >
                  {t('nav.suggestions')}
                </Link>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-12">
                <Link href={`/jobs?country=${countryCode}`}>
                  <Button
                    size="lg"
                    className="h-14 px-8 text-lg font-bold shadow-2xl shadow-primary/30 group relative overflow-hidden rounded-2xl"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      <Search className="w-5 h-5" />
                      {t('hero.browse')}
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </Button>
                </Link>
                <Link href="/cv">
                  <Button size="lg" variant="outline" className="h-14 px-8 text-lg font-bold rounded-2xl border-2">
                    {t('nav.cv')}
                  </Button>
                </Link>
              </div>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 text-sm">
                {[
                  { label: t('nav.blog'), href: '/blog' },
                  { label: t('nav.qbank'), href: '/qbank' },
                  { label: t('nav.prep'), href: '/prep' },
                ].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="text-muted-foreground hover:text-primary font-semibold underline-offset-4 hover:underline"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>

              <div className="mt-10 flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs text-muted-foreground">
                <span className="font-bold uppercase tracking-wider">{t('nav.country')}:</span>
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="rounded-xl border border-border bg-background px-3 py-2 text-sm font-medium max-w-[220px]"
                >
                  {COUNTRY_OPTIONS.map(({ code, name }) => (
                    <option key={code} value={code}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-8 mt-10">
                {[
                  { label: 'Verified jobs', icon: CheckCircle2 },
                  { label: 'Guides & blog', icon: CheckCircle2 },
                  { label: 'CV templates', icon: CheckCircle2 },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + i * 0.1 }}
                    className="flex items-center gap-3 bg-card/50 backdrop-blur-sm px-4 py-2 rounded-xl border border-border/50"
                  >
                    <item.icon className="w-5 h-5 text-primary" />
                    <span className="text-sm font-semibold">{item.label}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          <div className="flex-1 relative w-full max-w-lg mx-auto lg:max-w-none">
            <ThreeDCard className="relative z-10">
              <div className="relative rounded-[2.5rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] border-4 border-white/10 bg-card group">
                <img
                  src="https://picsum.photos/seed/chakriglobal/1000/800"
                  alt="Careers"
                  className="w-full h-auto object-cover scale-105 group-hover:scale-110 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <motion.div
                  style={{ transform: 'translateZ(80px)' }}
                  className="absolute top-10 left-10 p-6 bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl max-w-[220px]"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
                      <CheckCircle2 className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-white/60 uppercase tracking-widest">Your region</p>
                      <p className="text-xl font-black text-white">{countryName}</p>
                    </div>
                  </div>
                </motion.div>
                <motion.div
                  style={{ transform: 'translateZ(100px)' }}
                  className="absolute bottom-10 right-10 p-6 bg-primary/90 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-lg">
                      <Star className="w-8 h-8 text-primary fill-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-white/60 uppercase tracking-widest">Worldwide</p>
                      <p className="text-2xl font-black text-white">50K+ Users</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </ThreeDCard>
            <div className="absolute -inset-10 bg-primary/20 rounded-full blur-[100px] -z-10 animate-pulse" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
