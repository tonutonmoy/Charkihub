'use client';

import Link from 'next/link';
import { useAuth } from '@/src/components/AuthContext';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DashboardPage() {
  const { user, isLoggedIn } = useAuth();
  if (!isLoggedIn) {
    return (
      <Card className="rounded-2xl max-w-lg">
        <CardHeader>
          <CardTitle>Sign in required</CardTitle>
        </CardHeader>
        <CardContent>
          <Link href="/login" className={cn(buttonVariants({ variant: 'default', size: 'lg' }), 'rounded-xl')}>
            Login
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-tight">Welcome, {user?.name}</h1>
        <p className="text-muted-foreground mt-1">
          Country: {user?.countryCode} · Interests: {user?.interests?.join(', ') || '—'}
        </p>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg">Saved jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <Link
              href="/dashboard/favorites"
              className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'rounded-xl')}
            >
              Open favorites
            </Link>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg">Browse jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/jobs" className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'rounded-xl')}>
              Go to jobs
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
