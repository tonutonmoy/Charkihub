'use client';

import React, { useEffect, useState } from 'react';
import { Plus, RefreshCw, Trash2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/src/components/ConfirmDialog';
import {
  adminListSuggestions,
  adminCreateSuggestion,
  adminUpdateSuggestion,
  adminDeleteSuggestion,
  type ApiSuggestionAdmin,
} from '@/lib/api';

const empty: Record<string, unknown> = {
  title: '',
  summary: '',
  category: '',
  countryCode: 'BD',
  content: '',
  externalUrl: '',
  sortOrder: 0,
};

export default function SuggestionsAdmin() {
  const [items, setItems] = useState<ApiSuggestionAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, unknown>>(empty);

  const load = () => {
    setLoading(true);
    adminListSuggestions().then((r) => {
      if (r.ok) setItems(r.suggestions);
      else toast.error(r.error);
      setLoading(false);
    });
  };

  useEffect(() => {
    load();
  }, []);

  const startEdit = (s: ApiSuggestionAdmin) => {
    setEditingId(s.id);
    setForm({
      title: s.title,
      summary: s.summary,
      category: s.category,
      countryCode: s.countryCode,
      content: s.content || '',
      externalUrl: s.externalUrl || '',
      sortOrder: s.sortOrder,
    });
  };

  const save = async () => {
    if (!String(form.title || '').trim() || !String(form.summary || '').trim() || !String(form.category || '').trim()) {
      toast.error('Title, summary, and category are required');
      return;
    }
    if (editingId) {
      const r = await adminUpdateSuggestion(editingId, form);
      if (r.ok) {
        toast.success('Updated');
        setEditingId(null);
        setForm(empty);
        load();
      } else toast.error(r.error);
    } else {
      const r = await adminCreateSuggestion(form);
      if (r.ok) {
        toast.success('Created');
        setForm(empty);
        load();
      } else toast.error(r.error);
    }
  };

  const doDelete = async () => {
    if (!deleteId) return;
    const r = await adminDeleteSuggestion(deleteId);
    if (r.ok) {
      toast.success('Deleted');
      load();
    } else toast.error(r.error);
  };

  if (loading) return <p className="text-muted-foreground">Loading…</p>;

  return (
    <div className="space-y-8">
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Delete this suggestion?"
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => void doDelete()}
      />
      <div className="flex justify-between items-center gap-4 flex-wrap">
        <h1 className="text-3xl font-black">Suggestions</h1>
        <Button variant="outline" size="sm" className="rounded-xl gap-2" onClick={load}>
          <RefreshCw className="w-4 h-4" /> Refresh
        </Button>
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>{editingId ? 'Edit' : 'New suggestion'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="Title"
            value={String(form.title ?? '')}
            onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
            className="rounded-xl"
          />
          <Input
            placeholder="Summary"
            value={String(form.summary ?? '')}
            onChange={(e) => setForm((s) => ({ ...s, summary: e.target.value }))}
            className="rounded-xl"
          />
          <Input
            placeholder="Category"
            value={String(form.category ?? '')}
            onChange={(e) => setForm((s) => ({ ...s, category: e.target.value }))}
            className="rounded-xl"
          />
          <textarea
            placeholder="Content (optional)"
            value={String(form.content ?? '')}
            onChange={(e) => setForm((s) => ({ ...s, content: e.target.value }))}
            className="w-full min-h-[100px] rounded-xl border border-border bg-background px-3 py-2 text-sm"
          />
          <div className="grid md:grid-cols-3 gap-2">
            <Input
              placeholder="External URL"
              value={String(form.externalUrl ?? '')}
              onChange={(e) => setForm((s) => ({ ...s, externalUrl: e.target.value }))}
              className="rounded-xl"
            />
            <Input
              placeholder="Country"
              maxLength={2}
              value={String(form.countryCode ?? 'BD')}
              onChange={(e) => setForm((s) => ({ ...s, countryCode: e.target.value.toUpperCase() }))}
              className="rounded-xl"
            />
            <Input
              type="number"
              placeholder="Sort order"
              value={String(form.sortOrder ?? 0)}
              onChange={(e) => setForm((s) => ({ ...s, sortOrder: Number(e.target.value) }))}
              className="rounded-xl"
            />
          </div>
          <div className="flex gap-2">
            <Button className="rounded-xl" onClick={save}>
              <Plus className="w-4 h-4 mr-1" /> {editingId ? 'Save' : 'Create'}
            </Button>
            {editingId ? (
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => {
                  setEditingId(null);
                  setForm(empty);
                }}
              >
                Cancel
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>All</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {items.map((s) => (
            <div
              key={s.id}
              className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 py-3"
            >
              <div>
                <p className="font-bold">{s.title}</p>
                <p className="text-xs text-muted-foreground line-clamp-2">{s.summary}</p>
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="outline" className="rounded-lg" onClick={() => startEdit(s)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="destructive" className="rounded-lg" onClick={() => setDeleteId(s.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
          {items.length === 0 ? <p className="text-muted-foreground">No suggestions yet.</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
