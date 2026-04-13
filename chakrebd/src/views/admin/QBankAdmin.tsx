'use client';

import React, { useEffect, useState } from 'react';
import { Plus, RefreshCw, Trash2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/src/components/ConfirmDialog';
import {
  adminListQBank,
  adminCreateQBankItem,
  adminUpdateQBankItem,
  adminDeleteQBankItem,
  uploadFileBase64,
  type ApiQBankItem,
} from '@/lib/api';

const empty: Record<string, unknown> = {
  title: '',
  category: '',
  year: '',
  solved: true,
  description: '',
  pdfUrl: '',
  countryCode: 'BD',
  sortOrder: 0,
  published: true,
};

export default function QBankAdmin() {
  const [items, setItems] = useState<ApiQBankItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, unknown>>(empty);

  const load = () => {
    setLoading(true);
    adminListQBank().then((r) => {
      if (r.ok) setItems(r.items);
      else toast.error(r.error);
      setLoading(false);
    });
  };

  useEffect(() => {
    load();
  }, []);

  const startEdit = (s: ApiQBankItem) => {
    setEditingId(s.id);
    setForm({
      title: s.title,
      category: s.category,
      year: s.year,
      solved: s.solved,
      description: s.description || '',
      pdfUrl: s.pdfUrl || '',
      countryCode: s.countryCode,
      sortOrder: s.sortOrder,
      published: s.published,
    });
  };

  const save = async () => {
    if (!String(form.title || '').trim() || !String(form.category || '').trim() || !String(form.year || '').trim()) {
      toast.error('Title, category, and year are required');
      return;
    }
    if (editingId) {
      const r = await adminUpdateQBankItem(editingId, form);
      if (r.ok) {
        toast.success('Updated');
        setEditingId(null);
        setForm(empty);
        load();
      } else toast.error(r.error);
    } else {
      const r = await adminCreateQBankItem(form);
      if (r.ok) {
        toast.success('Created');
        setForm(empty);
        load();
      } else toast.error(r.error);
    }
  };

  const doDelete = async () => {
    if (!deleteId) return;
    const r = await adminDeleteQBankItem(deleteId);
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
        title="Delete this entry?"
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => void doDelete()}
      />
      <div className="flex justify-between items-center gap-4 flex-wrap">
        <h1 className="text-3xl font-black">Question bank</h1>
        <Button variant="outline" size="sm" className="rounded-xl gap-2" onClick={load}>
          <RefreshCw className="w-4 h-4" /> Refresh
        </Button>
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>{editingId ? 'Edit entry' : 'New entry'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="Title"
            value={String(form.title ?? '')}
            onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
            className="rounded-xl"
          />
          <div className="grid md:grid-cols-2 gap-2">
            <Input
              placeholder="Category (e.g. BCS)"
              value={String(form.category ?? '')}
              onChange={(e) => setForm((s) => ({ ...s, category: e.target.value }))}
              className="rounded-xl"
            />
            <Input
              placeholder="Year"
              value={String(form.year ?? '')}
              onChange={(e) => setForm((s) => ({ ...s, year: e.target.value }))}
              className="rounded-xl"
            />
          </div>
          <textarea
            placeholder="Description (optional)"
            value={String(form.description ?? '')}
            onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
            className="w-full min-h-[100px] rounded-xl border border-border bg-background px-3 py-2 text-sm"
          />
          <div>
            <span className="text-xs font-bold text-muted-foreground">PDF file (optional)</span>
            <input
              type="file"
              accept="application/pdf"
              className="mt-1 block w-full text-sm"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                const reader = new FileReader();
                reader.onload = async () => {
                  const data = String(reader.result || '');
                  const r = await uploadFileBase64(data, f.name);
                  if (r.ok) {
                    setForm((s) => ({ ...s, pdfUrl: r.url }));
                    toast.success('PDF uploaded');
                  } else toast.error(r.error);
                };
                reader.readAsDataURL(f);
              }}
            />
            {String(form.pdfUrl ?? '') ? (
              <p className="text-xs text-muted-foreground mt-1 truncate">Linked: {String(form.pdfUrl)}</p>
            ) : null}
          </div>
          <div className="grid md:grid-cols-3 gap-2 items-center">
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
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={Boolean(form.solved)}
                onChange={(e) => setForm((s) => ({ ...s, solved: e.target.checked }))}
              />
              Marked solved
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={Boolean(form.published)}
              onChange={(e) => setForm((s) => ({ ...s, published: e.target.checked }))}
            />
            Published (visible on site)
          </label>
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
          <CardTitle>All entries</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {items.map((s) => (
            <div
              key={s.id}
              className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 py-3"
            >
              <div>
                <p className="font-bold">{s.title}</p>
                <p className="text-xs text-muted-foreground">
                  {s.category} · {s.year} · {s.published ? 'live' : 'draft'}
                </p>
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
          {items.length === 0 ? <p className="text-muted-foreground">No items yet.</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
