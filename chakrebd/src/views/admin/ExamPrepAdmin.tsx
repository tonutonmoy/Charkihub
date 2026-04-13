'use client';

import React, { useEffect, useState } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import {
  superadminListExamCategories,
  superadminCreateExamCategory,
  superadminListExamCourses,
  superadminCreateExamCourse,
} from '@/lib/api';

const ExamPrepAdmin = () => {
  const [cats, setCats] = useState<Record<string, unknown>[]>([]);
  const [courses, setCourses] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [newCat, setNewCat] = useState({ label: '', slug: '', countryCode: 'BD' });
  const [newCourse, setNewCourse] = useState({
    categoryId: '',
    title: '',
    lessons: 0,
    duration: '',
    rating: 4.5,
    price: 'Free',
  });

  const load = () => {
    setLoading(true);
    Promise.all([superadminListExamCategories(), superadminListExamCourses()]).then(([a, b]) => {
      if (a.ok) {
        setCats(a.categories);
        setListError(null);
      } else setListError(a.error);
      if (b.ok) setCourses(b.courses);
      setLoading(false);
    });
  };

  useEffect(() => {
    load();
  }, []);

  const addCategory = async () => {
    if (!newCat.label.trim()) return;
    let slug =
      newCat.slug.trim() ||
      newCat.label
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
    if (!slug) slug = `cat-${Date.now().toString(36)}`;
    const r = await superadminCreateExamCategory({
      label: newCat.label.trim(),
      slug,
      countryCode: newCat.countryCode.toUpperCase().slice(0, 2),
    });
    if (r.ok) {
      toast.success('Category added');
      setNewCat({ label: '', slug: '', countryCode: 'BD' });
      load();
    } else toast.error(r.error);
  };

  const addCourse = async () => {
    if (!newCourse.categoryId || !newCourse.title.trim()) return;
    const r = await superadminCreateExamCourse({
      categoryId: newCourse.categoryId,
      title: newCourse.title.trim(),
      lessons: newCourse.lessons,
      duration: newCourse.duration,
      rating: newCourse.rating,
      price: newCourse.price,
      published: true,
    });
    if (r.ok) {
      toast.success('Course added');
      setNewCourse({ categoryId: newCourse.categoryId, title: '', lessons: 0, duration: '', rating: 4.5, price: 'Free' });
      load();
    } else toast.error(r.error);
  };

  if (loading) return <p className="text-muted-foreground">Loading…</p>;

  return (
    <div className="space-y-8">
      {listError ? (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm">
          <p className="font-bold text-destructive">Could not load exam prep data</p>
          <p className="text-muted-foreground mt-1">{listError}</p>
          <p className="text-xs text-muted-foreground mt-2">
            You need an admin account with “Exam prep” permission (or superadmin). Ask a superadmin to enable
            <code className="mx-1">manageExamPrep</code> for your role.
          </p>
        </div>
      ) : null}
      <div className="flex justify-between items-center gap-4 flex-wrap">
        <h1 className="text-3xl font-black">Exam prep (DB)</h1>
        <Button variant="outline" size="sm" className="rounded-xl gap-2" onClick={load}>
          <RefreshCw className="w-4 h-4" /> Refresh
        </Button>
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Categories</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-4 gap-2">
            <Input placeholder="Label" value={newCat.label} onChange={(e) => setNewCat((s) => ({ ...s, label: e.target.value }))} />
            <Input
              placeholder="slug (optional — auto from label)"
              value={newCat.slug}
              onChange={(e) => setNewCat((s) => ({ ...s, slug: e.target.value }))}
            />
            <Input
              placeholder="Country"
              maxLength={2}
              value={newCat.countryCode}
              onChange={(e) => setNewCat((s) => ({ ...s, countryCode: e.target.value }))}
            />
            <Button className="rounded-xl" onClick={addCategory}>
              <Plus className="w-4 h-4 mr-1" /> Add
            </Button>
          </div>
          <ul className="text-sm space-y-1">
            {cats.map((c) => (
              <li key={String(c.id)} className="flex justify-between border-b border-border/50 py-2">
                <span>
                  {(c.label as string) || ''} <span className="text-muted-foreground">({String(c.slug)})</span>{' '}
                  <span className="text-xs">{String(c.countryCode)}</span>
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Courses</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2">
            <select
              className="h-10 rounded-lg border border-border px-2 text-sm"
              value={newCourse.categoryId}
              onChange={(e) => setNewCourse((s) => ({ ...s, categoryId: e.target.value }))}
            >
              <option value="">Category</option>
              {cats.map((c) => (
                <option key={String(c.id)} value={String(c.id)}>
                  {String(c.label)}
                </option>
              ))}
            </select>
            <Input
              placeholder="Title"
              value={newCourse.title}
              onChange={(e) => setNewCourse((s) => ({ ...s, title: e.target.value }))}
            />
            <Input
              type="number"
              placeholder="Lessons"
              value={newCourse.lessons || ''}
              onChange={(e) => setNewCourse((s) => ({ ...s, lessons: Number(e.target.value) }))}
            />
            <Input
              placeholder="Duration"
              value={newCourse.duration}
              onChange={(e) => setNewCourse((s) => ({ ...s, duration: e.target.value }))}
            />
            <Input
              placeholder="Price"
              value={newCourse.price}
              onChange={(e) => setNewCourse((s) => ({ ...s, price: e.target.value }))}
            />
            <Button className="rounded-xl" onClick={addCourse}>
              <Plus className="w-4 h-4 mr-1" /> Add course
            </Button>
          </div>
          <ul className="text-sm space-y-2">
            {courses.map((c) => (
              <li key={String(c.id)} className="border-b border-border/50 py-2">
                <span className="font-bold">{String(c.title)}</span>{' '}
                <span className="text-muted-foreground text-xs">
                  {c.category && typeof c.category === 'object' && 'label' in (c.category as object)
                    ? String((c.category as { label: string }).label)
                    : ''}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExamPrepAdmin;
