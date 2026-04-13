'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/src/components/AuthContext';
import { listMyFavorites, type FavoriteResolved } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function FavoritesPage() {
  const { isLoggedIn } = useAuth();
  const [items, setItems] = useState<FavoriteResolved[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn) return;
    listMyFavorites().then((r) => {
      if (r.ok) setItems(r.favorites);
      setLoading(false);
    });
  }, [isLoggedIn]);

  if (!isLoggedIn) {
    return <p className="text-muted-foreground">Please sign in.</p>;
  }

  if (loading) return <p className="text-muted-foreground">Loading…</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-black">Favorite jobs & content</h1>
      <div className="space-y-4">
        {items.length === 0 ? (
          <p className="text-muted-foreground">No favorites yet.</p>
        ) : (
          items.map((f) => (
            <Card key={`${f.type}-${f.id}`} className="rounded-2xl">
              <CardHeader>
                <CardTitle className="text-base flex justify-between gap-4">
                  <span className="uppercase text-xs text-muted-foreground">{f.type}</span>
                  {f.type === 'job' && 'title' in f.item ? (
                    <Link href={`/jobs/${f.id}`} className="font-bold hover:text-primary text-right">
                      {(f.item as { title?: string }).title}
                    </Link>
                  ) : (
                    <span className="font-bold">{(f.item as { title?: string }).title ?? f.id}</span>
                  )}
                </CardTitle>
              </CardHeader>
              {f.type === 'job' ? (
                <CardContent>
                  <Link
                    href={`/jobs/${f.id}`}
                    className="inline-flex items-center justify-center rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium hover:bg-muted"
                  >
                    View job
                  </Link>
                </CardContent>
              ) : null}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
