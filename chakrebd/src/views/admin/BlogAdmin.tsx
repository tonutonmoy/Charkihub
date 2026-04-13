'use client';

import React, { useEffect, useState } from 'react';
import { Plus, RefreshCw, Trash2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/src/components/ConfirmDialog';
import {
  adminListBlogPosts,
  adminCreateBlogPost,
  adminUpdateBlogPost,
  adminDeleteBlogPost,
  type ApiBlogAdminItem,
} from '@/lib/api';

const emptyForm = {
  title: '',
  excerpt: '',
  content: '',
  category: 'general',
  countryCode: 'BD',
  published: true,
};

export default function BlogAdmin() {
  const [posts, setPosts] = useState<ApiBlogAdminItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const load = () => {
    setLoading(true);
    adminListBlogPosts().then((r) => {
      if (r.ok) setPosts(r.posts);
      else toast.error(r.error);
      setLoading(false);
    });
  };

  useEffect(() => {
    load();
  }, []);

  const startEdit = (p: ApiBlogAdminItem) => {
    setEditingId(p.id);
    setForm({
      title: p.title,
      excerpt: p.excerpt,
      content: p.content || '',
      category: p.category,
      countryCode: p.countryCode,
      published: p.published,
    });
  };

  const save = async () => {
    if (!form.title.trim() || !form.excerpt.trim() || !form.content.trim()) {
      toast.error('Title, excerpt, and content are required');
      return;
    }
    if (editingId) {
      const r = await adminUpdateBlogPost(editingId, { ...form });
      if (r.ok) {
        toast.success('Post updated');
        setEditingId(null);
        setForm(emptyForm);
        load();
      } else toast.error(r.error);
    } else {
      const r = await adminCreateBlogPost({ ...form });
      if (r.ok) {
        toast.success('Post created');
        setForm(emptyForm);
        load();
      } else toast.error(r.error);
    }
  };

  const doDelete = async () => {
    if (!deleteId) return;
    const r = await adminDeleteBlogPost(deleteId);
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
        title="Delete this post?"
        description="This cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => void doDelete()}
      />
      <div className="flex justify-between items-center gap-4 flex-wrap">
        <h1 className="text-3xl font-black">Blog</h1>
        <Button variant="outline" size="sm" className="rounded-xl gap-2" onClick={load}>
          <RefreshCw className="w-4 h-4" /> Refresh
        </Button>
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>{editingId ? 'Edit post' : 'New post'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
            className="rounded-xl"
          />
          <Input
            placeholder="Excerpt"
            value={form.excerpt}
            onChange={(e) => setForm((s) => ({ ...s, excerpt: e.target.value }))}
            className="rounded-xl"
          />
          <textarea
            placeholder="Content (markdown)"
            value={form.content}
            onChange={(e) => setForm((s) => ({ ...s, content: e.target.value }))}
            className="w-full min-h-[180px] rounded-xl border border-border bg-background px-3 py-2 text-sm"
          />
          <div className="grid md:grid-cols-3 gap-2">
            <Input
              placeholder="Category"
              value={form.category}
              onChange={(e) => setForm((s) => ({ ...s, category: e.target.value }))}
              className="rounded-xl"
            />
            <Input
              placeholder="Country (e.g. BD)"
              maxLength={2}
              value={form.countryCode}
              onChange={(e) => setForm((s) => ({ ...s, countryCode: e.target.value.toUpperCase() }))}
              className="rounded-xl"
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.published}
                onChange={(e) => setForm((s) => ({ ...s, published: e.target.checked }))}
              />
              Published
            </label>
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
                  setForm(emptyForm);
                }}
              >
                Cancel edit
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>All posts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {posts.map((p) => (
            <div
              key={p.id}
              className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 py-3"
            >
              <div>
                <p className="font-bold">{p.title}</p>
                <p className="text-xs text-muted-foreground">
                  {p.category} · {p.countryCode} · {p.published ? 'published' : 'draft'}
                </p>
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="outline" className="rounded-lg" onClick={() => startEdit(p)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="destructive" className="rounded-lg" onClick={() => setDeleteId(p.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
          {posts.length === 0 ? <p className="text-muted-foreground">No posts yet.</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
