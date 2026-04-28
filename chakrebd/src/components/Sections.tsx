'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { 
  Users, Briefcase, GraduationCap, 
  Quote, ArrowRight, Mail, Send, MapPin,
  Facebook, Twitter, Instagram, Linkedin, Github
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from './LanguageContext';
import { fetchPublicStats } from '@/lib/api';
import Image from 'next/image';

function formatStatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1).replace(/\.0$/, '')}M+`;
  if (n >= 10_000) return `${Math.round(n / 1000)}K+`;
  if (n >= 1_000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}K+`;
  return `${n.toLocaleString('en-US')}+`;
}

// --- Stats Section ---
export const Stats = () => {
  const { t } = useLanguage();
  const [jobs, setJobs] = useState<number | null>(null);
  const [users, setUsers] = useState<number | null>(null);
  const [exams, setExams] = useState<number | null>(null);

  useEffect(() => {
    fetchPublicStats().then((r) => {
      if (r.ok) {
        setJobs(r.jobsPublished);
        setUsers(r.activeUsers);
        setExams(r.examsCovered);
      }
    });
  }, []);

  const stats = [
    { label: t('stats.jobs'), value: jobs != null ? formatStatNumber(jobs) : '—', icon: Briefcase },
    { label: t('stats.users'), value: users != null ? formatStatNumber(users) : '—', icon: Users },
    { label: t('stats.exams'), value: exams != null ? formatStatNumber(exams) : '—', icon: GraduationCap },
  ];

  return (
    <section className="py-20 border-y border-border bg-card">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {stats.map((stat, i) => (
            <div key={i} className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                <stat.icon className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-4xl font-bold mb-2 tracking-tight">{stat.value}</h3>
              <p className="text-muted-foreground font-medium">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// --- Blog Section ---
export const Blog = () => {
  const { t } = useLanguage();
  const posts = [
    {
      title: 'How to Crack 46th BCS Preliminary',
      category: 'Exam Strategy',
      readTime: '8 min read',
      image: 'https://picsum.photos/seed/bcs/600/400'
    },
    {
      title: 'Top 10 Bank Job Interview Tips',
      category: 'Career Tips',
      readTime: '5 min read',
      image: 'https://picsum.photos/seed/bank/600/400'
    },
    {
      title: 'Staying Motivated During Long Prep',
      category: 'Motivation',
      readTime: '6 min read',
      image: 'https://picsum.photos/seed/motivation/600/400'
    }
  ];

  return (
    <section id="blog" className="py-24">
      <div className="container mx-auto px-4">
        <div className="flex items-end justify-between mb-12">
          <div>
            <h2 className="text-3xl font-bold mb-2">{t('nav.blog')}</h2>
            <p className="text-muted-foreground">Latest insights and strategies from experts.</p>
          </div>
          <Link href="/blog">
            <Button variant="ghost" className="hidden sm:flex group">
              View All Posts
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {posts.map((post, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <Link href={`/blog/${i + 1}`}>
                <Card className="overflow-hidden h-full border-border/50 hover:shadow-xl transition-all">
                  <div className="aspect-video overflow-hidden">
                    <img 
                      src={post.image} 
                      alt={post.title} 
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">
                        {post.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{post.readTime}</span>
                    </div>
                    <CardTitle className="text-xl leading-snug hover:text-primary transition-colors cursor-pointer">
                      {post.title}
                    </CardTitle>
                  </CardHeader>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// --- Testimonials ---
export const Testimonials = () => {
  const testimonials = [
    {
      name: 'Rahat Ahmed',
      role: '43rd BCS Cadre',
      text: 'ChakriHub BD was my daily companion. The structured suggestions and question bank are unmatched.',
      avatar: 'https://i.pravatar.cc/100?img=11'
    },
    {
      name: 'Sumaiya Akter',
      role: 'Senior Officer, Sonali Bank',
      text: 'The math shortcut modules helped me save crucial time during the preliminary exam. Highly recommended!',
      avatar: 'https://i.pravatar.cc/100?img=25'
    }
  ];

  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-16">Success Stories</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {testimonials.map((t, i) => (
            <Card key={i} className="bg-background border-border/50 relative overflow-hidden">
              <Quote className="absolute top-6 right-6 w-12 h-12 text-primary/5 -z-0" />
              <CardContent className="p-8 relative z-10">
                <p className="text-lg italic mb-6 text-muted-foreground">"{t.text}"</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary/20">
                    <img src={t.avatar} alt={t.name} />
                  </div>
                  <div>
                    <h4 className="font-bold">{t.name}</h4>
                    <p className="text-sm text-primary font-medium">{t.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

// --- Newsletter ---
export const Newsletter = () => {
  const { t } = useLanguage();
  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        <div className="bg-primary rounded-[2.5rem] p-8 md:p-16 text-center text-white relative overflow-hidden shadow-2xl shadow-primary/30">
          {/* Decorative shapes */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-secondary/20 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl" />
          
          <div className="relative z-10 max-w-2xl mx-auto">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-8">
              <Mail className="w-8 h-8" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('newsletter.title')}</h2>
            <p className="text-primary-foreground/80 mb-10 text-lg">
              Join 50,000+ job seekers who receive the latest circulars and study materials directly in their inbox.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <Input 
                placeholder="Enter your email" 
                className="h-14 bg-white/10 border-white/20 text-white placeholder:text-white/50 rounded-xl focus-visible:ring-white/30"
              />
              <Button size="lg" variant="secondary" className="h-14 px-8 font-bold rounded-xl">
                {t('newsletter.button')}
                <Send className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// --- Footer ---
export const Footer = () => {
  const { t } = useLanguage();
  return (
    <footer className="bg-card pt-20 pb-10 border-t border-border">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div className="space-y-6">
                  <Link href='/' >
   <Image
      src="/image/logo.png"
      alt="ChakriHub Logo"
      width={200}
      height={32}
      className="object-contain"
   />
</Link>
            <p className="text-muted-foreground leading-relaxed">
              Job search and exam prep for a worldwide audience—<span className="font-medium text-foreground">main focus on Bangladesh</span> government and competitive careers.
            </p>
            <div className="flex items-center gap-4">
              {[Facebook, Twitter, Instagram, Linkedin, Github].map((Icon, i) => (
                <a key={i} href="#" className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-white transition-all">
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-bold mb-6 text-lg">Quick Links</h4>
            <ul className="space-y-4">
              {[
                { label: 'About Us', href: '/about' },
                { label: 'Latest Jobs', href: '/jobs' },
                { label: 'Exam Prep', href: '/prep' },
                { label: 'Suggestions', href: '/suggestions' },
                { label: 'Blog', href: '/blog' }
              ].map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-muted-foreground hover:text-primary transition-colors">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-6 text-lg">Support</h4>
            <ul className="space-y-4">
              {['Help Center', 'Privacy Policy', 'Terms of Service', 'Cookie Policy', 'Contact Us'].map((link) => (
                <li key={link}>
                  <a href="#" className="text-muted-foreground hover:text-primary transition-colors">{link}</a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-6 text-lg">Contact Us</h4>
            <ul className="space-y-4 text-muted-foreground">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary shrink-0" />
                <span>Munshipara, Satkhira, Khulna, Bangladesh</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-primary shrink-0" />
                <span>support@chakrihub.bd</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-border text-center md:text-left text-sm text-muted-foreground">
          <p>© 2026 ChakriHub BD. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
