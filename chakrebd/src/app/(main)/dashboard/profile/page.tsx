'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/src/components/AuthContext';
import { updateProfile } from '@/lib/api';
import { COUNTRY_OPTIONS } from '@/lib/countries';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const PRESETS = ['BCS', 'Bank', 'School', 'Railway', 'Police', 'Government', 'Private IT', 'MCQ'];

export default function ProfilePage() {
  const { user, isLoggedIn, refreshUser } = useAuth();
  const [name, setName] = useState('');
  const [countryCode, setCountryCode] = useState('BD');
  const [localArea, setLocalArea] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setName(user.name);
    setCountryCode(user.countryCode || 'BD');
    setLocalArea(user.localArea || '');
    setInterests(user.interests || []);
  }, [user]);

  const toggle = (t: string) => {
    setInterests((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    const r = await updateProfile({
      name,
      countryCode,
      localArea: localArea || null,
      interests,
    });
    if (r.ok) {
      setMsg('Saved.');
      await refreshUser();
    } else setMsg(r.error);
  };

  if (!isLoggedIn) return <p className="text-muted-foreground">Please sign in.</p>;

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-3xl font-black">Profile</h1>
      <form onSubmit={save} className="space-y-4">
        <div>
          <label className="text-xs font-bold text-muted-foreground">Name</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} className="rounded-xl mt-1" />
        </div>
        <div>
          <label className="text-xs font-bold text-muted-foreground">Country</label>
          <select
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value)}
            className="w-full h-12 rounded-xl border border-border bg-background px-3 mt-1"
          >
            {COUNTRY_OPTIONS.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-bold text-muted-foreground">Local area</label>
          <Input value={localArea} onChange={(e) => setLocalArea(e.target.value)} className="rounded-xl mt-1" />
        </div>
        <div>
          <p className="text-xs font-bold text-muted-foreground mb-2">Interests</p>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((t) => (
              <Badge
                key={t}
                variant={interests.includes(t) ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => toggle(t)}
              >
                {t}
              </Badge>
            ))}
          </div>
        </div>
        {msg ? <p className="text-sm text-primary font-medium">{msg}</p> : null}
        <Button type="submit" className="rounded-xl">
          Save
        </Button>
      </form>
    </div>
  );
}
