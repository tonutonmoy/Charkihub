'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { UserPlus, Mail, Lock, User, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useAuth } from '../components/AuthContext';
import { COUNTRY_OPTIONS } from '@/lib/countries';
import { Badge } from '@/components/ui/badge';

const INTEREST_PRESETS = ['BCS', 'Bank', 'School', 'Railway', 'Police', 'Government', 'Private IT', 'MCQ'];

const Signup = () => {
  const { register } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [countryCode, setCountryCode] = useState('BD');
  const [localArea, setLocalArea] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const toggleInterest = (tag: string) => {
    setInterests((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const r = await register(name.trim(), email.trim(), password, {
      countryCode,
      localArea: localArea.trim() || undefined,
      interests: interests.length ? interests : undefined,
    });
    setLoading(false);
    if (r.ok) router.push('/dashboard');
    else setError(r.error ?? 'Could not create account');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 pt-20 pb-10 px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <Card className="rounded-[2.5rem] border-border/50 shadow-2xl shadow-primary/5 bg-card overflow-hidden">
          <CardHeader className="pt-12 pb-8 text-center">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/20">
              <UserPlus className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-3xl font-black tracking-tight">Create Account</CardTitle>
            <p className="text-muted-foreground mt-2 font-medium">Set your country and job interests for smarter filters.</p>
          </CardHeader>
          <CardContent className="space-y-6 px-8 md:px-12">
            <form onSubmit={handleSignup} className="space-y-6">
              {error ? (
                <p className="text-sm text-destructive font-medium text-center" role="alert">
                  {error}
                </p>
              ) : null}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      autoComplete="name"
                      className="h-14 pl-12 rounded-xl border-border/50 bg-muted/30 focus-visible:ring-primary/30"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      autoComplete="email"
                      className="h-14 pl-12 rounded-xl border-border/50 bg-muted/30 focus-visible:ring-primary/30"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      minLength={6}
                      className="h-14 pl-12 rounded-xl border-border/50 bg-muted/30 focus-visible:ring-primary/30"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Country</label>
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="w-full h-14 rounded-xl border border-border/50 bg-muted/30 px-4 text-sm font-medium"
                  >
                    {COUNTRY_OPTIONS.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">
                    Local area (optional)
                  </label>
                  <Input
                    value={localArea}
                    onChange={(e) => setLocalArea(e.target.value)}
                    placeholder="City / district"
                    className="h-14 rounded-xl border-border/50 bg-muted/30"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">
                    Job interests
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {INTEREST_PRESETS.map((tag) => (
                      <Badge
                        key={tag}
                        variant={interests.includes(tag) ? 'default' : 'outline'}
                        className="cursor-pointer rounded-lg px-3 py-1"
                        onClick={() => toggleInterest(tag)}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              <Button type="submit" disabled={loading} className="w-full h-14 rounded-xl font-black text-lg shadow-xl shadow-primary/20 group">
                {loading ? 'Creating account…' : 'Get Started'}
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </form>
          </CardContent>
          <CardFooter className="pb-12 pt-6 text-center justify-center">
            <p className="text-sm text-muted-foreground font-medium">
              Already have an account?{' '}
              <Link href="/login" className="text-primary font-black hover:underline">
                Login
              </Link>
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
};

export default Signup;
