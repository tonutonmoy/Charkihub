'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'motion/react';
import { Search, MapPin, Calendar, ArrowRight, SlidersHorizontal, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ThreeDCard } from '../components/ThreeDCard';
import { useLocation } from '@/lib/locationContext';
import { useAuth } from '../components/AuthContext';
import { useLanguage } from '../components/LanguageContext';
import {
  listJobs,
  fetchJobFilterOptions,
  fetchPublicJobFilters,
  type ApiJobListItem,
  type JobMainCategory,
  type PublicJobFiltersPayload,
} from '@/lib/api';
import { generateSlug } from '../lib/permailink';

function buildJobsQuery(params: Record<string, string | undefined>): string {
  const e = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === '') continue;
    e.set(k, v);
  }
  return e.toString();
}

const GovtJobs = () => {
  const { countryCode, countryName, setCountryCode } = useLocation();
  const { isLoggedIn, user } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const skipUrlWrite = useRef(true);

  const urlCountry = searchParams.get('country');
  const urlMain = searchParams.get('mainCategory') as JobMainCategory | null;
  const urlSub = searchParams.get('subCategory') || '';
  const urlArea = searchParams.get('localArea') || '';
  const urlSearch = searchParams.get('search') || '';
  const urlInterest = searchParams.get('interest') === '1';
  const urlMatchLoc = searchParams.get('matchLoc') === '1';

  const [searchInput, setSearchInput] = useState(urlSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(urlSearch);
  const [selectedCat, setSelectedCat] = useState<JobMainCategory | 'all'>(() =>
    urlMain && ['government', 'private', 'local'].includes(urlMain) ? urlMain : 'all'
  );
  const [subCategory, setSubCategory] = useState(urlSub);
  const [localArea, setLocalArea] = useState(urlArea);
  const [interestOnly, setInterestOnly] = useState(urlInterest);
  const [matchUserLocation, setMatchUserLocation] = useState(urlMatchLoc);
  const [advancedOpen, setAdvancedOpen] = useState(true);

  const [jobs, setJobs] = useState<ApiJobListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterHints, setFilterHints] = useState<{ subCategories: string[]; localAreas: string[] }>({
    subCategories: [],
    localAreas: [],
  });
  const [publicFilters, setPublicFilters] = useState<PublicJobFiltersPayload | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchPublicJobFilters().then((r) => {
      if (cancelled || !r.ok) return;
      setPublicFilters(r.data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (urlCountry && /^[A-Z]{2}$/i.test(urlCountry)) {
      setCountryCode(urlCountry.toUpperCase());
    }
  }, [urlCountry, setCountryCode]);

  useEffect(() => {
    const tmr = setTimeout(() => setDebouncedSearch(searchInput.trim()), 400);
    return () => clearTimeout(tmr);
  }, [searchInput]);

  useEffect(() => {
    setSearchInput(urlSearch);
    setDebouncedSearch(urlSearch.trim());
    if (urlMain && ['government', 'private', 'local'].includes(urlMain)) {
      setSelectedCat(urlMain);
    } else if (!urlMain) {
      setSelectedCat('all');
    }
    setSubCategory(urlSub);
    setLocalArea(urlArea);
    setInterestOnly(urlInterest);
    setMatchUserLocation(urlMatchLoc);
  }, [urlSearch, urlMain, urlSub, urlArea, urlInterest, urlMatchLoc]);

  const categories = useMemo(() => {
    const base = [
      { key: 'all' as const, label: t('jobs.typeAll') },
      { key: 'government' as const, label: t('jobs.typeGov') },
      { key: 'private' as const, label: t('jobs.typePrivate') },
      { key: 'local' as const, label: t('jobs.typeLocal') },
    ];
    const mains = publicFilters?.mainCategories;
    if (!mains?.length) return base;
    return base.map((b) => {
      if (b.key === 'all') return b;
      const m = mains.find((x) => x.value === b.key);
      return m ? { ...b, label: m.label } : b;
    });
  }, [t, publicFilters]);

  const subSelectOptions = useMemo(() => {
    const pack = publicFilters?.subCategoriesByCountry[countryCode];
    if (!pack) return [] as { value: string; label: string }[];
    if (selectedCat === 'all') {
      const map = new Map<string, string>();
      for (const arr of Object.values(pack)) {
        for (const o of arr) {
          if (!map.has(o.value)) map.set(o.value, o.label);
        }
      }
      return Array.from(map.entries())
        .map(([value, label]) => ({ value, label }))
        .sort((a, b) => a.label.localeCompare(b.label));
    }
    return [...(pack[selectedCat] || [])].sort((a, b) => a.label.localeCompare(b.label));
  }, [publicFilters, countryCode, selectedCat]);

  const citySelectOptions = useMemo(() => {
    return publicFilters?.citiesByCountry[countryCode] || [];
  }, [publicFilters, countryCode]);

  /** Quick filters from DB (JobFilterOption) for the active country only — no hard-coded IN/BD presets. */
  const quickPresets = useMemo(() => {
    if (!publicFilters) return [] as { key: string; label: string; apply: () => void }[];
    const subs = publicFilters.subCategoriesByCountry[countryCode];
    if (!subs) return [];
    const out: { key: string; label: string; apply: () => void }[] = [];
    const mainLabel = (m: JobMainCategory) =>
      m === 'government' ? t('jobs.typeGov') : m === 'private' ? t('jobs.typePrivate') : t('jobs.typeLocal');
    for (const main of ['government', 'private', 'local'] as const) {
      for (const o of (subs[main] || []).slice(0, 2)) {
        out.push({
          key: `${main}-${o.value}`,
          label: `${mainLabel(main)} · ${o.label}`,
          apply: () => {
            setSelectedCat(main);
            setSubCategory(o.value);
            setLocalArea('');
          },
        });
      }
    }
    for (const c of (publicFilters.citiesByCountry[countryCode] || []).slice(0, 2)) {
      out.push({
        key: `city-${c.value}`,
        label: `${t('jobs.typeLocal')} · ${c.label}`,
        apply: () => {
          setSelectedCat('local');
          setSubCategory('');
          setLocalArea(c.value);
        },
      });
    }
    return out.slice(0, 8);
  }, [publicFilters, countryCode, t]);

  useEffect(() => {
    let cancelled = false;
    fetchJobFilterOptions({
      country: countryCode,
      mainCategory: selectedCat === 'all' ? undefined : selectedCat,
    }).then((r) => {
      if (cancelled) return;
      if (r.ok) {
        setFilterHints({ subCategories: r.subCategories, localAreas: r.localAreas });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [countryCode, selectedCat]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listJobs({
      country: countryCode,
      mainCategory: selectedCat === 'all' ? undefined : selectedCat,
      subCategory: subCategory.trim() || undefined,
      localArea: localArea.trim() || undefined,
      search: debouncedSearch || undefined,
      interestMatch: interestOnly && isLoggedIn,
      matchUserLocation: matchUserLocation && isLoggedIn,
      limit: 48,
    }).then((r) => {
      if (cancelled) return;
      if (r.ok) {
        setJobs(r.jobs);
        setTotal(r.total);
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [
    countryCode,
    selectedCat,
    subCategory,
    localArea,
    debouncedSearch,
    interestOnly,
    matchUserLocation,
    isLoggedIn,
  ]);

  const pushUrl = useCallback(() => {
    const q = buildJobsQuery({
      country: countryCode,
      mainCategory: selectedCat === 'all' ? undefined : selectedCat,
      subCategory: subCategory.trim() || undefined,
      localArea: localArea.trim() || undefined,
      search: debouncedSearch || undefined,
      interest: interestOnly ? '1' : undefined,
      matchLoc: matchUserLocation ? '1' : undefined,
    });
    router.replace(q ? `/jobs?${q}` : '/jobs', { scroll: false });
  }, [
    router,
    countryCode,
    selectedCat,
    subCategory,
    localArea,
    debouncedSearch,
    interestOnly,
    matchUserLocation,
  ]);

  useEffect(() => {
    if (skipUrlWrite.current) {
      skipUrlWrite.current = false;
      return;
    }
    pushUrl();
  }, [pushUrl]);

  const clearFilters = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setSelectedCat('all');
    setSubCategory('');
    setLocalArea('');
    setInterestOnly(false);
    setMatchUserLocation(false);
    skipUrlWrite.current = true;
    const q = buildJobsQuery({ country: countryCode });
    router.replace(q ? `/jobs?${q}` : '/jobs', { scroll: false });
    queueMicrotask(() => {
      skipUrlWrite.current = false;
    });
  };

  const resultsLabel = t('jobs.resultsCount').replace('{n}', String(jobs.length));

  return (
    <div className="pt-32 pb-20 min-h-screen bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="mb-10 text-center">
          <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">
            {t('jobs.pageTitle')} — {countryName}
          </h1>
          <p className="text-muted-foreground text-lg max-w-3xl mx-auto">{t('jobs.pageSubtitle')}</p>
        </div>

        <div className="flex flex-col lg:grid lg:grid-cols-[minmax(260px,300px)_1fr] xl:grid-cols-[minmax(280px,320px)_1fr] gap-8 lg:gap-10 items-start">
          <aside className="w-full space-y-4 lg:sticky lg:top-28 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:pr-1 lg:pb-4 shrink-0 no-scrollbar">
            <div className="rounded-[1.5rem] bg-card p-5 shadow-xl shadow-primary/5 border border-border/50 space-y-4">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('jobs.sidebarSearch')}</p>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder={t('jobs.searchPlaceholder')}
                  className="pl-10 h-11 rounded-xl border-border/50 focus-visible:ring-primary/30 text-sm"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
              </div>

              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  {t('jobs.sidebarJobType')}
                </p>
                <div className="flex flex-col gap-2">
                  {categories.map((cat) => (
                    <Button
                      key={cat.key}
                      variant={selectedCat === cat.key ? 'default' : 'outline'}
                      className="rounded-xl h-10 px-3 font-bold text-sm w-full justify-start"
                      onClick={() => setSelectedCat(cat.key)}
                    >
                      {cat.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2 border-t border-border/50">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  {t('jobs.advanced')}
                </span>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-xl text-xs flex-1"
                    onClick={() => setAdvancedOpen(!advancedOpen)}
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 mr-1 shrink-0" />
                    {advancedOpen ? '−' : '+'}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="rounded-xl text-xs flex-1"
                    onClick={clearFilters}
                  >
                    <X className="w-3.5 h-3.5 mr-1 shrink-0" />
                    {t('jobs.clearFilters')}
                  </Button>
                </div>
              </div>
            </div>

            {advancedOpen ? (
              <div className="space-y-4 bg-card/90 p-5 rounded-[1.5rem] border border-border/50 shadow-sm">
                <div>
                  <p className="text-sm font-bold mb-2">{t('nav.country')}</p>
                  <select
                    className="w-full h-11 rounded-xl border border-border bg-background px-3 text-sm font-medium"
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                  >
                    {(publicFilters?.countries?.length
                      ? publicFilters.countries
                      : [{ value: countryCode, label: countryName }]
                    ).map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label} ({c.value})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <p className="text-sm font-bold mb-2">{t('jobs.subCategoryLabel')}</p>
                  <p className="text-xs text-muted-foreground mb-2">{t('jobs.subCategoryHint')}</p>
                  <select
                    className="w-full h-10 rounded-xl border border-border bg-background px-3 text-sm mb-2"
                    value=""
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v) setSubCategory(v);
                    }}
                  >
                    <option value="">{t('jobs.pickSub')}</option>
                    {subSelectOptions.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <Input
                    className="rounded-xl h-10 text-sm"
                    value={subCategory}
                    onChange={(e) => setSubCategory(e.target.value)}
                    list="job-sub-suggestions"
                    placeholder={t('jobs.subCategoryHint')}
                  />
                  <datalist id="job-sub-suggestions">
                    {filterHints.subCategories.map((s) => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <p className="text-sm font-bold mb-2">{t('jobs.localAreaLabel')}</p>
                  <p className="text-xs text-muted-foreground mb-2">{t('jobs.localAreaHint')}</p>
                  <select
                    className="w-full h-10 rounded-xl border border-border bg-background px-3 text-sm mb-2"
                    value=""
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v) setLocalArea(v);
                    }}
                  >
                    <option value="">{t('jobs.pickCity')}</option>
                    {citySelectOptions.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <Input
                    className="rounded-xl h-10 text-sm"
                    value={localArea}
                    onChange={(e) => setLocalArea(e.target.value)}
                    list="job-area-suggestions"
                    placeholder={t('jobs.localAreaHint')}
                  />
                  <datalist id="job-area-suggestions">
                    {filterHints.localAreas.map((s) => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
                </div>
                <div className="flex flex-col gap-2">
                  {isLoggedIn && (user?.interests?.length ?? 0) > 0 ? (
                    <Button
                      variant={interestOnly ? 'default' : 'outline'}
                      className="rounded-xl h-auto min-h-10 py-2 px-3 text-left text-sm w-full justify-start whitespace-normal"
                      onClick={() => setInterestOnly(!interestOnly)}
                    >
                      {t('jobs.matchInterest')} ({user?.interests?.join(', ')})
                    </Button>
                  ) : (
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {isLoggedIn ? t('jobs.matchInterestsHint') : `${t('jobs.matchInterest')} — ${t('nav.login')}`}
                    </p>
                  )}
                  {isLoggedIn && user?.localArea ? (
                    <Button
                      variant={matchUserLocation ? 'default' : 'outline'}
                      className="rounded-xl text-sm w-full justify-start"
                      onClick={() => setMatchUserLocation(!matchUserLocation)}
                    >
                      {t('jobs.matchMyLocation')} ({user.localArea})
                    </Button>
                  ) : (
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {isLoggedIn ? t('jobs.matchLocationHint') : `${t('jobs.matchMyLocation')} — ${t('nav.login')}`}
                    </p>
                  )}
                </div>
                {quickPresets.length > 0 ? (
                  <div className="flex flex-col gap-2 pt-3 border-t border-border/60">
                    <span className="text-xs font-bold text-muted-foreground">
                      {t('jobs.quickFilters')} ({countryCode})
                    </span>
                    <div className="flex flex-col gap-2">
                      {quickPresets.map((q) => (
                        <Button
                          key={q.key}
                          type="button"
                          variant="outline"
                          size="sm"
                          className="rounded-xl h-auto min-h-9 py-2 px-3 text-left text-xs font-medium justify-start whitespace-normal"
                          onClick={q.apply}
                        >
                          {q.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </aside>

          <div className="min-w-0 w-full">
            <p className="text-sm text-muted-foreground mb-6 font-medium">{resultsLabel}</p>

            {loading ? (
              <p className="text-center text-muted-foreground py-20">{t('jobs.loading')}</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 xl:gap-8">
                {jobs.map((job, i) => (
                  <motion.div
                    key={job.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <ThreeDCard>
                     <Link href={`/jobs/${generateSlug(job.id, job.title)}`}>
                        <Card className="h-full hover:shadow-2xl transition-all duration-500 border-border/50 group bg-card/80 backdrop-blur-sm rounded-[2rem] overflow-hidden">
                          <CardHeader className="pb-4">
                            <div className="flex justify-between items-start mb-4">
                              <Badge
                                variant="secondary"
                                className="rounded-lg px-3 py-1 font-black text-[10px] uppercase tracking-widest bg-primary/10 text-primary border-none"
                              >
                                {job.subCategory}
                              </Badge>
                              <Badge
                                variant="outline"
                                className="rounded-lg px-3 py-1 font-bold text-[10px] uppercase tracking-widest border-secondary/20 text-secondary"
                              >
                                {job.mainCategory}
                              </Badge>
                            </div>
                            <CardTitle className="text-xl font-black group-hover:text-primary transition-colors leading-tight line-clamp-2">
                              {job.title}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <p className="text-sm font-bold text-muted-foreground line-clamp-2">{job.summary}</p>
                            <p className="text-sm font-bold text-muted-foreground line-clamp-1">{job.organization}</p>
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                                <MapPin className="w-4 h-4 text-primary" />
                                {job.localArea || job.countryCode}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                                <Calendar className="w-4 h-4 text-secondary" />
                                {t('jobs.until')} {new Date(job.endAt).toLocaleString()}
                              </div>
                            </div>
                            <div className="pt-4 flex items-center justify-between">
                              <span className="text-xs font-black text-primary uppercase tracking-widest flex items-center gap-1">
                                {t('jobs.viewDetails')}{' '}
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                              </span>
                              <span className="text-xs text-muted-foreground">♥ {job.likeCount}</span>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    </ThreeDCard>
                  </motion.div>
                ))}
              </div>
            )}

            {!loading && jobs.length === 0 && (
              <div className="text-center py-20">
                <p className="text-xl text-muted-foreground font-bold">{t('jobs.noResults')}</p>
                <p className="text-sm text-muted-foreground mt-2">API total: {total}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GovtJobs;
