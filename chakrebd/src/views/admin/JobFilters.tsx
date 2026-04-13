'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2, Filter, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/src/components/AuthContext';
import {
  superadminListJobFilters,
  superadminCreateJobFilter,
  superadminUpdateJobFilter,
  superadminDeleteJobFilter,
  type ApiJobFilterOption,
} from '@/lib/api';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/src/components/ConfirmDialog';

const KINDS = ['country', 'city', 'main_category', 'sub_category'] as const;
const MAINS = ['government', 'private', 'local'] as const;

const AdminJobFilters = () => {
  const router = useRouter();
  const { user, ready } = useAuth();
  const [items, setItems] = useState<ApiJobFilterOption[]>([]);
  const [deleteRow, setDeleteRow] = useState<ApiJobFilterOption | null>(null);
  const [loading, setLoading] = useState(true);
  const [kindFilter, setKindFilter] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ApiJobFilterOption | null>(null);
  const [form, setForm] = useState({
    kind: 'city' as (typeof KINDS)[number],
    countryCode: '',
    mainCategory: '',
    value: '',
    label: '',
    sortOrder: 0,
    active: true,
  });

  const isSuper = user?.role === 'superadmin';

  const load = () => {
    setLoading(true);
    superadminListJobFilters({
      kind: kindFilter || undefined,
    }).then((r) => {
      if (r.ok) setItems(r.items);
      setLoading(false);
    });
  };

  useEffect(() => {
    if (!ready) return;
    if (!isSuper) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, isSuper, kindFilter]);

  const openCreate = () => {
    setEditing(null);
    setForm({
      kind: 'city',
      countryCode: '',
      mainCategory: 'government',
      value: '',
      label: '',
      sortOrder: 0,
      active: true,
    });
    setDialogOpen(true);
  };

  const openEdit = (row: ApiJobFilterOption) => {
    setEditing(row);
    setForm({
      kind: row.kind as (typeof KINDS)[number],
      countryCode: row.countryCode,
      mainCategory: row.mainCategory || 'government',
      value: row.value,
      label: row.label,
      sortOrder: row.sortOrder,
      active: row.active,
    });
    setDialogOpen(true);
  };

  const save = async () => {
    if (editing) {
      const r = await superadminUpdateJobFilter(editing.id, {
        label: form.label,
        sortOrder: form.sortOrder,
        active: form.active,
        value: form.value,
        countryCode: form.countryCode,
        mainCategory: form.kind === 'sub_category' ? form.mainCategory : '',
      });
      if (r.ok) {
        toast.success('Filter updated');
        setDialogOpen(false);
        load();
      } else toast.error(r.error);
    } else {
      const r = await superadminCreateJobFilter({
        kind: form.kind,
        countryCode: form.kind === 'country' ? undefined : form.countryCode,
        mainCategory: form.kind === 'sub_category' ? form.mainCategory : undefined,
        value: form.value,
        label: form.label,
        sortOrder: form.sortOrder,
        active: form.active,
      });
      if (r.ok) {
        toast.success('Filter created');
        setDialogOpen(false);
        load();
      } else toast.error(r.error);
    }
  };

  const doDelete = async () => {
    if (!deleteRow) return;
    const r = await superadminDeleteJobFilter(deleteRow.id);
    if (r.ok) {
      toast.success('Filter deleted');
      load();
    } else toast.error(r.error);
  };

  if (!ready) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!isSuper) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Job filters</h1>
        <p className="text-muted-foreground">Only the super admin can manage search filters.</p>
        <Button variant="outline" onClick={() => router.push('/admin')}>
          Back to admin
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <ConfirmDialog
        open={!!deleteRow}
        onOpenChange={(o) => !o && setDeleteRow(null)}
        title={deleteRow ? `Delete “${deleteRow.label}”?` : 'Delete filter?'}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => void doDelete()}
      />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Filter className="w-8 h-8 text-primary" />
            Job search filters
          </h1>
          <p className="text-muted-foreground mt-1">
            Countries, cities, main categories (gov / private / local), and subcategories per country. Used in advanced
            job search.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-xl gap-2" onClick={load}>
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          <Button className="rounded-xl gap-2 shadow-lg shadow-primary/20" onClick={openCreate}>
            <Plus className="w-5 h-5" />
            Add option
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-sm font-semibold text-muted-foreground">Kind:</span>
        <Button
          size="sm"
          variant={kindFilter === '' ? 'default' : 'outline'}
          className="rounded-full"
          onClick={() => setKindFilter('')}
        >
          All
        </Button>
        {KINDS.map((k) => (
          <Button
            key={k}
            size="sm"
            variant={kindFilter === k ? 'default' : 'outline'}
            className="rounded-full font-mono text-xs"
            onClick={() => setKindFilter(k)}
          >
            {k}
          </Button>
        ))}
      </div>

      <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden">
        <CardHeader className="border-b border-border bg-muted/30">
          <CardTitle className="text-lg">{items.length} entries</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="px-4 py-3 font-bold">Kind</th>
                  <th className="px-4 py-3 font-bold">Country</th>
                  <th className="px-4 py-3 font-bold">Main</th>
                  <th className="px-4 py-3 font-bold">Value</th>
                  <th className="px-4 py-3 font-bold">Label</th>
                  <th className="px-4 py-3 font-bold">Order</th>
                  <th className="px-4 py-3 font-bold">Active</th>
                  <th className="px-4 py-3 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                      Loading…
                    </td>
                  </tr>
                ) : (
                  items.map((row) => (
                    <tr key={row.id} className="hover:bg-muted/20">
                      <td className="px-4 py-3">
                        <Badge variant="secondary" className="font-mono text-[10px]">
                          {row.kind}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 font-mono">{row.countryCode || '—'}</td>
                      <td className="px-4 py-3 font-mono">{row.mainCategory || '—'}</td>
                      <td className="px-4 py-3 font-medium">{row.value}</td>
                      <td className="px-4 py-3">{row.label}</td>
                      <td className="px-4 py-3">{row.sortOrder}</td>
                      <td className="px-4 py-3">
                        <Badge variant={row.active ? 'default' : 'outline'}>{row.active ? 'yes' : 'no'}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right space-x-1">
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(row)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => setDeleteRow(row)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-2xl max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit filter option' : 'New filter option'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {!editing ? (
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">Kind</label>
                <select
                  className={cn(
                    'mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm',
                    editing && 'opacity-60'
                  )}
                  value={form.kind}
                  disabled={Boolean(editing)}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, kind: e.target.value as (typeof KINDS)[number] }))
                  }
                >
                  {KINDS.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Kind: <span className="font-mono font-bold">{editing.kind}</span> (cannot change)
              </p>
            )}
            {form.kind === 'country' ? (
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">ISO country code</label>
                <Input
                  className="mt-1 rounded-xl font-mono"
                  value={form.value}
                  onChange={(e) => setForm((f) => ({ ...f, value: e.target.value.toUpperCase().slice(0, 2) }))}
                  placeholder="BD"
                  maxLength={2}
                />
              </div>
            ) : (
              <>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase">Country code</label>
                  <Input
                    className="mt-1 rounded-xl font-mono"
                    value={form.countryCode}
                    onChange={(e) => setForm((f) => ({ ...f, countryCode: e.target.value.toUpperCase().slice(0, 2) }))}
                    placeholder="IN"
                    maxLength={2}
                  />
                </div>
                {form.kind === 'sub_category' ? (
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase">Main category</label>
                    <select
                      className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                      value={form.mainCategory}
                      onChange={(e) => setForm((f) => ({ ...f, mainCategory: e.target.value }))}
                    >
                      {MAINS.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase">Value (stored on jobs)</label>
                  <Input
                    className="mt-1 rounded-xl"
                    value={form.value}
                    onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
                    placeholder="Kolkata / Bank / IT"
                  />
                </div>
              </>
            )}
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase">Display label</label>
              <Input
                className="mt-1 rounded-xl"
                value={form.label}
                onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">Sort order</label>
                <Input
                  type="number"
                  className="mt-1 rounded-xl"
                  value={form.sortOrder}
                  onChange={(e) => setForm((f) => ({ ...f, sortOrder: parseInt(e.target.value, 10) || 0 }))}
                />
              </div>
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                  />
                  Active
                </label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button className="rounded-xl" onClick={save}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminJobFilters;
