'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { LogIn, Mail, Lock, ArrowRight, Github, Chrome } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useAuth } from '../components/AuthContext';

const Login = () => {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const r = await login(email.trim(), password);
    setLoading(false);
    if (r.ok) router.push('/');
    else setError(r.error ?? 'Login failed');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 pt-20 pb-10 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="rounded-[2.5rem] border-border/50 shadow-2xl shadow-primary/5 bg-card overflow-hidden">
          <CardHeader className="pt-12 pb-8 text-center">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/20">
              <LogIn className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-3xl font-black tracking-tight">Welcome Back</CardTitle>
            <p className="text-muted-foreground mt-2 font-medium">Login to access your dashboard</p>
          </CardHeader>
          <CardContent className="space-y-6 px-8 md:px-12">
            <form onSubmit={handleLogin} className="space-y-6">
              {error ? (
                <p className="text-sm text-destructive font-medium text-center" role="alert">
                  {error}
                </p>
              ) : null}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Email Address</label>
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
                  <div className="flex justify-between items-center ml-1">
                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Password</label>
                    <a href="#" className="text-xs font-bold text-primary hover:underline">Forgot password?</a>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      className="h-14 pl-12 rounded-xl border-border/50 bg-muted/30 focus-visible:ring-primary/30"
                      required
                    />
                  </div>
                </div>
              </div>
              <Button type="submit" disabled={loading} className="w-full h-14 rounded-xl font-black text-lg shadow-xl shadow-primary/20 group">
                {loading ? 'Signing in…' : 'Login'}
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </form>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-4 text-muted-foreground font-bold">Or continue with</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" className="h-14 rounded-xl font-bold border-border/50 hover:bg-muted/50">
                <Chrome className="mr-2 w-5 h-5" /> Google
              </Button>
              <Button variant="outline" className="h-14 rounded-xl font-bold border-border/50 hover:bg-muted/50">
                <Github className="mr-2 w-5 h-5" /> Github
              </Button>
            </div>
          </CardContent>
          <CardFooter className="pb-12 pt-6 text-center justify-center">
            <p className="text-sm text-muted-foreground font-medium">
              Don't have an account?{' '}
              <Link href="/signup" className="text-primary font-black hover:underline">Sign up</Link>
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
};

export default Login;
