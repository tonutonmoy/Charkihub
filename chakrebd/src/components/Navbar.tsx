'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, Globe, Moon, Sun, Bell, ChevronDown, User, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage, SUPPORTED_LOCALES } from './LanguageContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTheme } from './ThemeContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useAuth } from './AuthContext';
import { useLocation } from '@/lib/locationContext';
import { COUNTRY_OPTIONS } from '@/lib/countries';
import { listNotifications } from '@/lib/api';
import { playNotificationSound } from '@/src/lib/notificationSound';

const Navbar = () => {
  const { locale, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { isLoggedIn, logout, user } = useAuth();
  const { countryCode, countryName, setCountryCode } = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [unreadNotif, setUnreadNotif] = useState(0);
  const prevUnreadRef = useRef<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!isLoggedIn) {
      prevUnreadRef.current = null;
      setUnreadNotif(0);
      return;
    }
    const poll = async () => {
      const r = await listNotifications(true);
      if (!r.ok) return;
      const n = r.notifications.length;
      if (prevUnreadRef.current !== null && n > prevUnreadRef.current) {
        playNotificationSound();
      }
      prevUnreadRef.current = n;
      setUnreadNotif(n);
    };
    void poll();
    const id = window.setInterval(() => void poll(), 35000);
    return () => clearInterval(id);
  }, [isLoggedIn]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const jobHref = (main?: 'government' | 'private' | 'local') => {
    const base = `/jobs?country=${countryCode}`;
    if (!main) return base;
    return `${base}&mainCategory=${main}`;
  };

  const mainLinks = [
    { name: t('nav.home'), href: '/' },
    { name: t('nav.prep'), href: '/prep' },
    { name: t('nav.community'), href: '/community' },
    { name: t('nav.suggestions'), href: `/suggestions?country=${countryCode}` },
    { name: t('nav.qbank'), href: '/qbank' },
    { name: t('nav.cv'), href: '/cv' },
    { name: t('nav.blog'), href: `/blog?country=${countryCode}` },
  ];

  return (
    <nav
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isScrolled
          ? 'bg-background/85 backdrop-blur-md border-b border-border py-2.5 shadow-sm'
          : 'bg-transparent py-4'
      )}
    >
      <div className="container mx-auto px-4 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 shrink-0 min-w-0">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
            <span className="text-white font-bold text-xl">C</span>
          </div>
          <div className="hidden sm:flex flex-col leading-tight min-w-0">
            <span className="text-lg font-black tracking-tight truncate">{t('brand.name')}</span>
            <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider truncate">
              {t('brand.tagline')}
            </span>
          </div>
        </Link>

        <div className="hidden xl:flex items-center gap-1 flex-1 justify-center min-w-0">
          {mainLinks.slice(0, 1).map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-3 py-2 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors rounded-lg"
            >
              {link.name}
            </Link>
          ))}

          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1 px-3 py-2 text-sm font-semibold text-muted-foreground hover:text-primary rounded-lg outline-none">
              <Briefcase className="w-4 h-4" />
              {t('nav.jobsMenu')}
              <ChevronDown className="w-4 h-4 opacity-60" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-52 rounded-xl">
              <DropdownMenuItem onClick={() => router.push(jobHref('government'))} className="font-medium">
                {t('nav.jobsGov')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(jobHref('private'))} className="font-medium">
                {t('nav.jobsPrivate')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(jobHref('local'))} className="font-medium">
                {t('nav.jobsLocal')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push(jobHref())} className="font-medium">
                {t('nav.jobsAll')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {mainLinks.slice(1).map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-3 py-2 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors rounded-lg whitespace-nowrap"
            >
              {link.name}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger
              className="hidden md:flex items-center gap-1.5 max-w-[140px] h-9 px-2 rounded-full border border-border/60 bg-muted/40 hover:bg-muted text-xs font-bold"
              title={t('nav.country')}
            >
              <span className="truncate">{countryCode}</span>
              <ChevronDown className="w-3 h-3 opacity-60 shrink-0" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="max-h-[min(70vh,360px)] overflow-y-auto rounded-xl w-52">
              {COUNTRY_OPTIONS.map(({ code, name }) => (
                <DropdownMenuItem
                  key={code}
                  onClick={() => setCountryCode(code)}
                  className={cn(code === countryCode && 'bg-primary/10 font-bold')}
                >
                  {name} ({code})
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-muted transition-colors">
              <Globe className="h-5 w-5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl w-[min(100vw-2rem,280px)] p-0">
              <ScrollArea className="h-[min(70vh,360px)]">
                <div className="p-1">
                  {SUPPORTED_LOCALES.map(({ code, label }) => (
                    <DropdownMenuItem
                      key={code}
                      onClick={() => setLanguage(code)}
                      className={cn(code === locale && 'bg-primary/10 font-bold')}
                    >
                      {label} ({code.toUpperCase()})
                    </DropdownMenuItem>
                  ))}
                </div>
              </ScrollArea>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full hidden sm:flex">
            {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </Button>

          {isLoggedIn ? (
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full relative hidden sm:flex"
              onClick={() => router.push('/dashboard/notifications')}
              title={t('nav.notifications')}
            >
              <Bell className="h-5 w-5" />
              {unreadNotif > 0 ? (
                <span className="absolute top-1.5 right-1.5 min-w-[8px] h-2 w-2 rounded-full bg-primary ring-2 ring-background" />
              ) : null}
            </Button>
          ) : null}

          <div className="hidden sm:flex items-center gap-1">
            {isLoggedIn ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-2 pl-2 pr-1 h-9 rounded-full hover:bg-muted transition-colors max-w-[160px]">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium truncate hidden lg:inline">{user?.name ?? 'Account'}</span>
                  <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-xl">
                  <DropdownMenuItem onClick={() => router.push('/dashboard')}>Dashboard</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/dashboard/favorites')}>Favorites</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/dashboard/profile')}>Profile</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/dashboard/notifications')}>
                    {t('nav.notifications')}
                  </DropdownMenuItem>
                  {(user?.role === 'admin' || user?.role === 'superadmin') && (
                    <DropdownMenuItem onClick={() => router.push('/admin')}>Admin</DropdownMenuItem>
                  )}
                  <DropdownMenuItem className="text-destructive" onClick={logout}>
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button variant="ghost" className="font-medium text-sm px-3" onClick={() => router.push('/login')}>
                  {t('nav.login')}
                </Button>
                <Button className="font-medium text-sm shadow-lg shadow-primary/20 px-4" onClick={() => router.push('/signup')}>
                  {t('nav.signup')}
                </Button>
              </>
            )}
          </div>

          <Sheet>
            <SheetTrigger className="xl:hidden flex items-center justify-center w-9 h-9 rounded-full hover:bg-muted transition-colors">
              <Menu className="h-6 w-6" />
            </SheetTrigger>
            <SheetContent side="right" className="w-[min(100vw,380px)] overflow-y-auto">
              <div className="flex flex-col gap-2 mt-8">
                <p className="text-xs font-bold text-muted-foreground px-2">{countryName}</p>
                <Link href="/" className="text-lg font-semibold py-2 hover:text-primary">
                  {t('nav.home')}
                </Link>
                <p className="text-xs font-bold text-muted-foreground px-2 pt-2">{t('nav.jobsMenu')}</p>
                <Link href={jobHref('government')} className="pl-4 py-1.5 font-medium hover:text-primary">
                  {t('nav.jobsGov')}
                </Link>
                <Link href={jobHref('private')} className="pl-4 py-1.5 font-medium hover:text-primary">
                  {t('nav.jobsPrivate')}
                </Link>
                <Link href={jobHref('local')} className="pl-4 py-1.5 font-medium hover:text-primary">
                  {t('nav.jobsLocal')}
                </Link>
                <Link href={jobHref()} className="pl-4 py-1.5 font-medium hover:text-primary">
                  {t('nav.jobsAll')}
                </Link>
                {mainLinks.slice(1).map((link) => (
                  <Link key={link.href} href={link.href} className="text-lg font-semibold py-2 hover:text-primary">
                    {link.name}
                  </Link>
                ))}
                <div className="border-t border-border my-4 pt-4">
                  <p className="text-xs font-bold text-muted-foreground mb-2">{t('nav.country')}</p>
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background p-3 text-sm font-medium"
                  >
                    {COUNTRY_OPTIONS.map(({ code, name }) => (
                      <option key={code} value={code}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
                {isLoggedIn ? (
                  <>
                    <Button variant="outline" className="w-full rounded-xl mt-2" onClick={() => router.push('/dashboard')}>
                      Dashboard
                    </Button>
                    <Button variant="outline" className="w-full rounded-xl" onClick={() => router.push('/dashboard/notifications')}>
                      {t('nav.notifications')}
                    </Button>
                  </>
                ) : (
                  <div className="flex flex-col gap-2 mt-4">
                    <Button variant="outline" className="w-full rounded-xl" onClick={() => router.push('/login')}>
                      {t('nav.login')}
                    </Button>
                    <Button className="w-full rounded-xl" onClick={() => router.push('/signup')}>
                      {t('nav.signup')}
                    </Button>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
