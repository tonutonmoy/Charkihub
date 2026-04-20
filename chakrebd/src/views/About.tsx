'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { Building2, Briefcase, HeartHandshake, MapPin, Mail, ArrowRight } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

const PHOTO_CEO =
"https://scontent.fdac31-1.fna.fbcdn.net/v/t39.30808-6/481994369_3878284885759168_5482202163565674564_n.jpg?_nc_cat=105&ccb=1-7&_nc_sid=dd6889&_nc_eui2=AeEJnrvTV__SpNawE7DasYU7s2itSbtwL72zaK1Ju3AvvS7O7UddnuqdVUh4f7xTdDYrEbrQOJOFHsLW-cPUV_jo&_nc_ohc=4cQneZSOl7MQ7kNvwFVksfU&_nc_oc=AdqF1RkirzVcpneCZix7Z2pzPXNzSC_ubZ5fWafd_G3UYqUQYK5ZbJ8vk8rqAymBvHE&_nc_zt=23&_nc_ht=scontent.fdac31-1.fna&_nc_gid=BnuOxDDgJqoQLqRb7EXHbw&_nc_ss=7a3a8&oh=00_Af3fgPsnb4BmbWRXjpetEx0xoJgUohtVZkdyhL5K4DVvvA&oe=69EC8629"
export default function About() {
  return (
    <div className="pt-24 pb-20 min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/60 bg-gradient-to-b from-primary/8 via-background to-background">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(var(--primary)/0.15),transparent)] pointer-events-none" />
        <div className="container mx-auto px-4 py-16 md:py-24 max-w-4xl text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/80 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              <Building2 className="w-3.5 h-3.5 text-primary" />
              About ChakriHub BD
            </span>
            <h1 className="mt-6 text-4xl md:text-5xl font-black tracking-tight text-balance">
              Built for job seekers worldwide
            </h1>
            <p className="mt-5 text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              ChakriHub BD is for anyone chasing better opportunities across borders—while our{' '}
              <span className="font-semibold text-foreground">main focus stays on Bangladesh</span>: government and
              competitive jobs, exam prep, listings, and community. Built by{' '}
              <span className="font-semibold text-foreground"><a href="https://tonusoft.com/">TonuSoft</a></span> for a clear, professional experience.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="container mx-auto px-4 max-w-5xl space-y-16 md:space-y-24">
        {/* Mission */}
        <section className="pt-12 md:pt-16">
          <div className="grid md:grid-cols-2 gap-10 md:gap-14 items-start">
            <div>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-4">Our mission</h2>
              <p className="text-muted-foreground leading-relaxed">
                We believe access to structured exam prep, timely job listings, and peer support should not be scattered
                across dozens of sites—whether you are in Dhaka or abroad. ChakriHub BD brings jobs, preparation resources,
                Q-bank, CV tools, and community together, with{' '}
                <span className="font-medium text-foreground">Bangladesh opportunities and exams as our core priority</span>.
              </p>
            </div>
            <Card className="rounded-2xl border-border/60 shadow-sm overflow-hidden">
              <CardContent className="p-8 flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                  <HeartHandshake className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <a href="https://tonusoft.com/" className="font-bold text-lg mb-2">TonuSoft</a>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    ChakriHub BD is a <a href="https://tonusoft.com/">TonuSoft</a> product—built with attention to quality, security, and a user experience
                    suitable for serious exam preparation and professional networking.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Leadership */}
        <section>
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl md:text-3xl font-black tracking-tight">Leadership</h2>
            <p className="mt-3 text-muted-foreground">
              The team behind <a href="https://tonusoft.com/">TonuSoft</a> and ChakriHub BD
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <motion.article
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="group rounded-2xl border border-border/60 bg-card overflow-hidden shadow-sm hover:shadow-md hover:border-primary/25 transition-all"
            >
              <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                <img
                  src={PHOTO_CEO}
                  alt="Showmic Arefin Tonmoy"
                  className="w-full h-full object-cover object-top group-hover:scale-[1.02] transition-transform duration-500"
                  loading="eager"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />
              </div>
              <div className="p-6 md:p-8">
                <p className="text-xs font-bold uppercase tracking-wider text-primary mb-1">Founder &amp; CEO</p>
                <h3 className="text-xl font-black">Showmic Arefin Tonmoy</h3>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                  Leading product vision and strategy for <a href="https://tonusoft.com/">TonuSoft</a> and ChakriHub BD—tools for job seekers globally, with
                  Bangladesh as the primary market and deepest investment.
                </p>
              </div>
            </motion.article>

            <motion.article
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.08 }}
              className="group rounded-2xl border border-border/60 bg-card overflow-hidden shadow-sm hover:shadow-md hover:border-primary/25 transition-all"
            >
              <div className="aspect-[4/3] bg-muted relative overflow-hidden">
             
              </div>
          
            </motion.article>
          </div>
        </section>

        {/* Office & contact */}
        <section className="pb-4">
          <Card className="rounded-2xl border-border/60 bg-muted/30 overflow-hidden">
            <CardContent className="p-8 md:p-10">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-black flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-primary" />
                      Office
                    </h3>
                    <p className="mt-2 text-muted-foreground leading-relaxed">
                      Munshipara, Satkhira, Khulna, Bangladesh
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-black flex items-center gap-2">
                      <Mail className="w-5 h-5 text-primary" />
                      Contact
                    </h3>
                    <a
                      href="mailto:support@chakrihub.bd"
                      className="mt-2 text-primary font-semibold hover:underline"
                    >
                      support@chakrihub.bd
                    </a>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                  <Link
                    href="/jobs"
                    className={cn(
                      buttonVariants({ variant: 'default', size: 'lg' }),
                      'rounded-xl font-bold h-11 px-6'
                    )}
                  >
                    <Briefcase className="w-4 h-4 mr-2" />
                    Browse jobs
                  </Link>
                  <Link
                    href="/community"
                    className={cn(
                      buttonVariants({ variant: 'outline', size: 'lg' }),
                      'rounded-xl font-bold h-11 px-6'
                    )}
                  >
                    Community
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
