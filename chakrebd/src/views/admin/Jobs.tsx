'use client';

import React, { useEffect, useState } from 'react';
import {
  Plus,
  Search,
  MoreVertical,
  Edit2,
  Trash2,
  Eye,
  Briefcase,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/src/components/ConfirmDialog';
import {
  adminListJobs,
  adminCreateJob,
  adminUpdateJob,
  adminDeleteJob,
  uploadFileBase64,
  type ApiAdminJob,
} from '@/lib/api';

const emptyForm = (): Record<string, unknown> => ({
  mainCategory: 'government',
  subCategory: 'BCS',
  countryCode: 'BD',
  localArea: '',
  title: '',
  summary: '',
  description: '',
  organization: '',
  applyUrl: '',
  phone: '',
  startAt: new Date().toISOString().slice(0, 16),
  endAt: new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 16),
  pdfUrl: '',
  alertEnabled: false,
  alertMessage: '',
  status: 'published',
});

const AdminJobs = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [jobs, setJobs] = useState<ApiAdminJob[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteJobId, setDeleteJobId] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, unknown>>(emptyForm);

  const load = () => {
    setLoading(true);
    adminListJobs({ search: searchTerm.trim() || undefined, limit: 100 }).then((r) => {
      if (r.ok) {
        setJobs(r.jobs);
        setTotal(r.total);
      }
      setLoading(false);
    });
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setDialogOpen(true);
  };

  const openEdit = (j: ApiAdminJob) => {
    setEditingId(j.id);
    setForm({
      mainCategory: j.mainCategory,
      subCategory: j.subCategory,
      countryCode: j.countryCode,
      localArea: j.localArea || '',
      title: j.title,
      summary: j.summary,
      description: j.description || '',
      organization: j.organization,
      applyUrl: j.applyUrl || '',
      phone: j.phone || '',
      startAt: j.startAt.slice(0, 16),
      endAt: j.endAt.slice(0, 16),
      pdfUrl: j.pdfUrl || '',
      alertEnabled: j.alertEnabled,
      alertMessage: j.alertMessage || '',
      status: j.status,
    });
    setDialogOpen(true);
  };

  const save = async () => {
    const payload = {
      ...form,
      startAt: new Date(String(form.startAt)).toISOString(),
      endAt: new Date(String(form.endAt)).toISOString(),
      localArea: form.localArea ? String(form.localArea) : null,
    };
    if (editingId) {
      const r = await adminUpdateJob(editingId, payload);
      if (r.ok) {
        toast.success('Job updated');
        setDialogOpen(false);
        load();
      } else toast.error(r.error);
    } else {
      const r = await adminCreateJob(payload);
      if (r.ok) {
        toast.success('Job created');
        setDialogOpen(false);
        load();
      } else toast.error(r.error);
    }
  };

  const doDeleteJob = async () => {
    if (!deleteJobId) return;
    const r = await adminDeleteJob(deleteJobId);
    if (r.ok) {
      toast.success('Job deleted');
      load();
    } else toast.error(r.error);
  };

  return (
    <div className="space-y-8">
      <ConfirmDialog
        open={!!deleteJobId}
        onOpenChange={(o) => !o && setDeleteJobId(null)}
        title="Delete this job?"
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => void doDeleteJob()}
      />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Job Management</h1>
          <p className="text-muted-foreground mt-1">Create, edit, and delete job posts (admin).</p>
        </div>
        <Button className="rounded-xl h-12 px-6 font-bold shadow-lg shadow-primary/20 gap-2" onClick={openCreate}>
          <Plus className="w-5 h-5" />
          Add New Job
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search jobs, organizations..."
            className="pl-10 h-12 rounded-xl bg-card border-border/50 focus-visible:ring-primary/20"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load()}
          />
        </div>
        <Button variant="outline" className="rounded-xl h-12 font-bold" onClick={load}>
          Search
        </Button>
      </div>

      <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-muted-foreground">Job</th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-muted-foreground">Org</th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-muted-foreground">Category</th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-muted-foreground">Ends</th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-muted-foreground">Status</th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-muted-foreground text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                    Loading…
                  </td>
                </tr>
              ) : (
                jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Briefcase className="w-4 h-4 text-primary" />
                        </div>
                        <span className="font-bold text-sm truncate max-w-[200px]">{job.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-muted-foreground">{job.organization}</td>
                    <td className="px-6 py-4">
                      <Badge variant="secondary" className="rounded-lg font-bold text-[10px] uppercase tracking-wider">
                        {job.subCategory}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-muted-foreground">
                      {new Date(job.endAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      {job.status === 'published' && (
                        <div className="flex items-center gap-1.5 text-green-500 font-bold text-xs">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Published
                        </div>
                      )}
                      {job.status === 'draft' && (
                        <div className="flex items-center gap-1.5 text-orange-500 font-bold text-xs">
                          <Clock className="w-3.5 h-3.5" />
                          Draft
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          className={cn(
                            'inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent size-8',
                            'hover:bg-muted'
                          )}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl w-40">
                          <DropdownMenuItem
                            className="gap-2"
                            onClick={() => window.open(`/jobs/${job.id}`, '_blank')}
                          >
                            <Eye className="w-4 h-4" /> View
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2" onClick={() => openEdit(job)}>
                            <Edit2 className="w-4 h-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2 text-destructive" onClick={() => setDeleteJobId(job.id)}>
                            <Trash2 className="w-4 h-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 bg-muted/20 border-t border-border text-xs text-muted-foreground">
          Showing {jobs.length} of {total}
        </div>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-[min(100vw-2rem,56rem)] w-full max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit job' : 'New job'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-xs font-bold text-muted-foreground">Main category</span>
                <select
                  className="w-full h-10 rounded-lg border border-border mt-1 px-2 text-sm"
                  value={String(form.mainCategory)}
                  onChange={(e) => setForm((f) => ({ ...f, mainCategory: e.target.value }))}
                >
                  <option value="government">government</option>
                  <option value="private">private</option>
                  <option value="local">local</option>
                </select>
              </div>
              <div>
                <span className="text-xs font-bold text-muted-foreground">Sub category</span>
                <Input
                  value={String(form.subCategory || '')}
                  onChange={(e) => setForm((f) => ({ ...f, subCategory: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-xs font-bold text-muted-foreground">Country (ISO2)</span>
                <Input
                  value={String(form.countryCode || '')}
                  onChange={(e) => setForm((f) => ({ ...f, countryCode: e.target.value.toUpperCase().slice(0, 2) }))}
                  className="mt-1"
                  maxLength={2}
                />
              </div>
              <div>
                <span className="text-xs font-bold text-muted-foreground">Local area (optional)</span>
                <Input
                  value={String(form.localArea || '')}
                  onChange={(e) => setForm((f) => ({ ...f, localArea: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <span className="text-xs font-bold text-muted-foreground">Title</span>
              <Input
                value={String(form.title || '')}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <span className="text-xs font-bold text-muted-foreground">Summary</span>
              <Input
                value={String(form.summary || '')}
                onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <span className="text-xs font-bold text-muted-foreground">Organization</span>
              <Input
                value={String(form.organization || '')}
                onChange={(e) => setForm((f) => ({ ...f, organization: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <span className="text-xs font-bold text-muted-foreground">Description</span>
              <textarea
                className="w-full min-h-[80px] rounded-lg border border-border mt-1 p-2 text-sm"
                value={String(form.description || '')}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-xs font-bold text-muted-foreground">Apply URL (optional)</span>
                <Input
                  value={String(form.applyUrl || '')}
                  onChange={(e) => setForm((f) => ({ ...f, applyUrl: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <span className="text-xs font-bold text-muted-foreground">Phone (optional)</span>
                <Input
                  value={String(form.phone || '')}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-xs font-bold text-muted-foreground">Start</span>
                <Input
                  type="datetime-local"
                  value={String(form.startAt || '')}
                  onChange={(e) => setForm((f) => ({ ...f, startAt: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <span className="text-xs font-bold text-muted-foreground">End</span>
                <Input
                  type="datetime-local"
                  value={String(form.endAt || '')}
                  onChange={(e) => setForm((f) => ({ ...f, endAt: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <span className="text-xs font-bold text-muted-foreground">PDF file (upload)</span>
              <input
                type="file"
                accept="application/pdf"
                className="mt-2 block w-full text-xs"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  const reader = new FileReader();
                  reader.onload = async () => {
                    const data = String(reader.result || '');
                    const r = await uploadFileBase64(data, f.name);
                    if (r.ok) {
                      setForm((fm) => ({ ...fm, pdfUrl: r.url }));
                      toast.success('PDF uploaded');
                    } else toast.error(r.error);
                  };
                  reader.readAsDataURL(f);
                }}
              />
              {String(form.pdfUrl || '') ? (
                <p className="text-[10px] text-muted-foreground mt-1 truncate">File: {String(form.pdfUrl)}</p>
              ) : (
                <p className="text-[10px] text-muted-foreground mt-1">Choose a PDF to attach (stored on the API server).</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="alert"
                checked={Boolean(form.alertEnabled)}
                onChange={(e) => setForm((f) => ({ ...f, alertEnabled: e.target.checked }))}
              />
              <label htmlFor="alert" className="text-sm font-medium cursor-pointer">
                Show alert callout
              </label>
            </div>
            {form.alertEnabled ? (
              <div>
                <span className="text-xs font-bold text-muted-foreground">Alert message</span>
                <Input
                  value={String(form.alertMessage || '')}
                  onChange={(e) => setForm((f) => ({ ...f, alertMessage: e.target.value }))}
                  className="mt-1"
                />
              </div>
            ) : null}
            <div>
              <span className="text-xs font-bold text-muted-foreground">Status</span>
              <select
                className="w-full h-10 rounded-lg border border-border mt-1 px-2 text-sm"
                value={String(form.status)}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              >
                <option value="published">published</option>
                <option value="draft">draft</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminJobs;
