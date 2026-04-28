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
import HeroSectionAnimation from './HeroSectionAnimation';
import { useTheme } from './ThemeContext';

const Hero = () => {
  const { t } = useLanguage();
  const { countryCode, countryName, setCountryCode } = useLocation();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const jobLinks = (main: 'government' | 'private' | 'local') =>
    `/jobs?country=${countryCode}&mainCategory=${main}`;

  return (
    <section className={cn(
     "relative pt-24 isolate min-h-screen w-full overflow-x-clip overflow-y-hidden transition-all duration-500",
      // 🌟 Hero background gradient – visible everywhere behind the 3D scene
      isDark
        ? "bg-gradient-to-br from-[#0a0f1e] via-[#0f172a] to-[#0b1120]"
        : "bg-gradient-to-br from-[#f8fafc] via-[#eef2ff] to-[#ffffff]"
    )}>
      {/* Animated blur orbs for extra depth */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
        <div className={cn(
          "absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full animate-pulse-slow",
          isDark ? "bg-primary/15 blur-[150px]" : "bg-primary/10 blur-[100px]"
        )} />
        <div className={cn(
          "absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full animate-pulse-slow",
          isDark ? "bg-secondary/15 blur-[150px]" : "bg-secondary/10 blur-[100px]"
        )} />
        <div className="absolute top-1/3 left-1/3 w-64 h-64 rounded-full bg-accent/5 blur-[120px] animate-pulse" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          {/* Left content (unchanged) */}
          <div className="flex-1 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            >
              <div className={cn(
                "inline-flex flex-wrap items-center justify-center lg:justify-start gap-2 px-4 py-2 rounded-full text-xs font-bold mb-6 uppercase tracking-widest border shadow-sm transition-colors backdrop-blur-sm",
                isDark 
                  ? "bg-white/5 text-primary border-white/10" 
                  : "bg-white/60 text-primary border-primary/20 shadow-md"
              )}>
                <Sparkles className={cn("w-4 h-4", isDark ? "fill-primary" : "text-primary")} />
                <span>{t('hero.badge')}</span>
                <span className="hidden sm:inline opacity-40">|</span>
                <span className="inline-flex items-center gap-1 font-black">
                  <MapPin className="w-3.5 h-3.5" />
                  {countryName} ({countryCode})
                </span>
              </div>

              <h1 className={cn(
                "text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] mb-6 tracking-tight",
                isDark ? "text-white drop-shadow-lg" : "text-gray-900"
              )}>
                {t('hero.titleWW')}
              </h1>

              <p className={cn(
                "text-lg md:text-xl mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed",
                isDark ? "text-gray-300" : "text-gray-600"
              )}>
                {t('hero.subtitleWW')}
              </p>

              {/* Chips, buttons, etc. - same as your existing code */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 mb-8">
                <Link
                  href={jobLinks('government')}
                  className={cn(
                    buttonVariants({ variant: 'secondary', size: 'sm' }),
                    "rounded-full font-bold transition-all",
                    !isDark ? "bg-white/70 text-gray-800 border-gray-300 hover:bg-white shadow-sm" : ""
                  )}
                >
                  {t('hero.chipGov')}
                </Link>
                <Link
                  href={jobLinks('private')}
                  className={cn(
                    buttonVariants({ variant: 'secondary', size: 'sm' }),
                    "rounded-full font-bold transition-all",
                    !isDark ? "bg-white/70 text-gray-800 border-gray-300 hover:bg-white shadow-sm" : ""
                  )}
                >
                  {t('hero.chipPrivate')}
                </Link>
                <Link
                  href={jobLinks('local')}
                  className={cn(
                    buttonVariants({ variant: 'secondary', size: 'sm' }),
                    "rounded-full font-bold transition-all",
                    !isDark ? "bg-white/70 text-gray-800 border-gray-300 hover:bg-white shadow-sm" : ""
                  )}
                >
                  {t('hero.chipLocal')}
                </Link>
                <Link
                  href={`/suggestions?country=${countryCode}`}
                  className={cn(
                    buttonVariants({ variant: 'outline', size: 'sm' }),
                    "rounded-full font-bold transition-all",
                    !isDark ? "border-gray-400 text-gray-700 bg-white/40 hover:bg-white/70" : ""
                  )}
                >
                  {t('nav.suggestions')}
                </Link>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-12">
                <Link href={`/jobs?country=${countryCode}`}>
                  <Button
                    size="lg"
                    className={cn(
                      "h-14 px-8 text-lg font-bold group relative overflow-hidden rounded-2xl transition-all",
                      isDark 
                        ? "shadow-2xl shadow-primary/30" 
                        : "shadow-lg shadow-primary/30 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary"
                    )}
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      <Search className="w-5 h-5" />
                      {t('hero.browse')}
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </Button>
                </Link>
                <Link href="/cv">
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className={cn(
                      "h-14 px-8 text-lg font-bold rounded-2xl border-2 transition-all",
                      isDark 
                        ? "border-white/30 text-white hover:bg-white/10" 
                        : "border-primary/40 text-primary hover:bg-primary/5"
                    )}
                  >
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
                    className={cn(
                      "font-semibold underline-offset-4 hover:underline transition-colors",
                      isDark ? "text-gray-300 hover:text-white" : "text-gray-600 hover:text-primary"
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>

              <div className="mt-10 flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs">
                <span className={cn("font-bold uppercase tracking-wider", isDark ? "text-gray-400" : "text-gray-500")}>
                  {t('nav.country')}:
                </span>
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className={cn(
                    "rounded-xl border px-3 py-2 text-sm font-medium max-w-[220px] transition-colors backdrop-blur-sm",
                    isDark 
                      ? "border-gray-700 bg-gray-800/80 text-white" 
                      : "border-gray-300 bg-white/80 text-gray-800 shadow-sm"
                  )}
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
                    className={cn(
                      "flex items-center gap-3 backdrop-blur-md px-4 py-2 rounded-xl border transition-all",
                      isDark 
                        ? "bg-white/5 border-white/10 text-gray-200" 
                        : "bg-white/60 border-gray-200 shadow-sm text-gray-700"
                    )}
                  >
                    <item.icon className="w-5 h-5 text-primary" />
                    <span className="text-sm font-semibold">{item.label}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right side: 3D Animation – completely transparent background */}
          <div className="flex-1 relative w-full max-w-lg mx-auto lg:max-w-none">
            <ThreeDCard className="relative z-10">
              {/* ✅ No background, only borders and shadow if desired */}
              <div className={cn(
                "relative overflow-hidden group w-full h-full min-h-[700px] rounded-3xl transition-all",
                isDark ? "border border-white/5" : "border border-white/30"
              )}>
                <HeroSectionAnimation />
                {/* Soft gradient overlay to fade the animation edges – optional but does not hide gradient */}
                <div className={cn(
                  "absolute inset-0 pointer-events-none",
                  isDark 
                    ? "bg-gradient-to-t from-black/20 via-transparent to-transparent" 
                    : "bg-gradient-to-t from-white/10 via-transparent to-transparent"
                )} />
                
                {/* Floating cards remain unchanged */}
                <motion.div
                  style={{ transform: 'translateZ(80px)' }}
                  className={cn(
                    "absolute top-10 left-10 p-5 backdrop-blur-xl rounded-2xl border shadow-xl max-w-[200px] z-20 transition-all",
                    isDark 
                      ? "bg-white/10 border-white/20" 
                      : "bg-white/70 border-white/50 shadow-md"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-md">
                      <CheckCircle2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className={cn("text-[10px] font-black uppercase tracking-wider", isDark ? "text-white/60" : "text-primary/70")}>
                        Your region
                      </p>
                      <p className={cn("text-lg font-black", isDark ? "text-white" : "text-gray-800")}>
                        {countryName}
                      </p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  style={{ transform: 'translateZ(100px)' }}
                  className={cn(
                    "absolute bottom-10 right-10 p-5 backdrop-blur-xl rounded-2xl border shadow-xl z-20 transition-all",
                    isDark 
                      ? "bg-primary/80 border-white/20" 
                      : "bg-primary/90 border-white/40 shadow-md"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-md">
                      <Star className="w-6 h-6 text-primary fill-primary" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-white/70 uppercase tracking-wider">Worldwide</p>
                      <p className="text-xl font-black text-white">50K+ Users</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </ThreeDCard>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;