'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/components/AuthContext';
import { changePassword } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { isLoggedIn, user, logout } = useAuth();
  const router = useRouter();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [msg, setMsg] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (user?.role === 'superadmin') {
      setMsg('Superadmin accounts cannot change password from this screen.');
      return;
    }
    const r = await changePassword(current, next);
    if (r.ok) {
      toast.success('Password updated. Please sign in again.');
      logout();
      router.push('/login');
    } else setMsg(r.error);
  };

  if (!isLoggedIn) return <p className="text-muted-foreground">Please sign in.</p>;

  if (user?.role === 'superadmin') {
    return (
      <div className="max-w-md space-y-6">
        <h1 className="text-3xl font-black">Security</h1>
        <p className="text-sm text-muted-foreground">
          Superadmin password is managed via server environment (e.g. SUPER_ADMIN_PASSWORD), not from this app.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md space-y-6">
      <h1 className="text-3xl font-black">Security</h1>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="text-xs font-bold text-muted-foreground">Current password</label>
          <Input
            type="password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            className="rounded-xl mt-1"
            required
          />
        </div>
        <div>
          <label className="text-xs font-bold text-muted-foreground">New password</label>
          <Input
            type="password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            className="rounded-xl mt-1"
            minLength={6}
            required
          />
        </div>
        {msg ? (
          <p className="text-sm font-medium text-destructive" role="alert">
            {msg}
          </p>
        ) : null}
        <Button type="submit" className="rounded-xl">
          Update password
        </Button>
      </form>
    </div>
  );
}
