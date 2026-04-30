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
  FileText,
  Image as ImageIcon,
  FileArchive,
  X,
  Upload,
  File,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
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

// ====================== Types ======================
interface Attachment {
  id: string;
  url: string;
  name: string;
  mimeType: string;
  size?: number;
}

// ====================== Helpers ======================
const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith('image/')) return <ImageIcon className="w-4 h-4" />;
  if (mimeType === 'application/pdf') return <FileText className="w-4 h-4" />;
  if (mimeType.includes('zip') || mimeType.includes('compressed')) return <FileArchive className="w-4 h-4" />;
  return <File className="w-4 h-4" />;
};

const formatFileSize = (bytes?: number) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const isImage = (mimeType: string) => mimeType.startsWith('image/');

const emptyForm = () => ({
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
  alertEnabled: false,
  alertMessage: '',
  status: 'published',
});

// ====================== Main Component ======================
export default function AdminJobs() {
  const [searchTerm, setSearchTerm] = useState('');
  const [jobs, setJobs] = useState<ApiAdminJob[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteJobId, setDeleteJobId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewType, setPreviewType] = useState('');

  // Load jobs
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
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setAttachments([]);
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
      alertEnabled: j.alertEnabled,
      alertMessage: j.alertMessage || '',
      status: j.status,
    });
    setAttachments((j as any).attachments || []);
    setDialogOpen(true);
  };

  // Multi-file upload to R2
  const handleUploadFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    const newAttachments: Attachment[] = [];
    let hasError = false;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 50 * 1024 * 1024) {
        toast.error(`${file.name} too large (max 50MB)`);
        hasError = true;
        continue;
      }
      const allowed = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
        'application/pdf', 'application/zip', 'application/x-zip-compressed',
      ];
      if (!allowed.includes(file.type)) {
        toast.error(`${file.name} unsupported type`);
        hasError = true;
        continue;
      }
      try {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        const result = await uploadFileBase64(base64, file.name);
        if (result.ok) {
          newAttachments.push({
            id: `temp_${Date.now()}_${i}`,
            url: result.url,
            name: file.name,
            mimeType: file.type,
            size: file.size,
          });
          toast.success(`Uploaded: ${file.name}`);
        } else {
          toast.error(`Failed: ${file.name} – ${result.error}`);
          hasError = true;
        }
      } catch {
        toast.error(`Error uploading ${file.name}`);
        hasError = true;
      }
    }
    setAttachments((prev) => [...prev, ...newAttachments]);
    setUploading(false);
    if (hasError) toast.warning('Some files failed');
    else if (newAttachments.length) toast.success(`${newAttachments.length} file(s) uploaded`);
  };

  // Remove attachment from local UI – backend will delete from R2 on save
  const removeAttachment = (attachment: Attachment) => {
    setAttachments((prev) => prev.filter((a) => a.id !== attachment.id));
    toast.success(`Removed: ${attachment.name} (will be deleted from storage when you save)`);
  };

  const openPreview = (att: Attachment) => {
    setPreviewUrl(att.url);
    setPreviewType(att.mimeType);
    setPreviewOpen(true);
  };

  // Save job (create or update) – backend deletes orphaned attachments automatically
  const save = async () => {
    if (!form.title || !form.summary || !form.organization || !form.startAt || !form.endAt) {
      toast.error('Please fill required fields');
      return;
    }
    const payload = {
      ...form,
      startAt: new Date(form.startAt).toISOString(),
      endAt: new Date(form.endAt).toISOString(),
      localArea: form.localArea || null,
      attachments: attachments.map(({ id, url, name, mimeType, size }) => ({ id, url, name, mimeType, size })),
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

  // Delete entire job – backend deletes all attachments from R2 first
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

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl w-full rounded-2xl">
          <DialogHeader><DialogTitle>File Preview</DialogTitle></DialogHeader>
          <div className="flex justify-center items-center min-h-[300px]">
            {previewType.startsWith('image/') ? (
              <img src={previewUrl} alt="Preview" className="max-w-full max-h-[70vh] rounded-lg" />
            ) : previewType === 'application/pdf' ? (
              <iframe src={previewUrl} className="w-full h-[70vh] rounded-lg" title="PDF" />
            ) : (
              <div className="text-center">
                <File className="w-16 h-16 mx-auto text-muted-foreground" />
                <p className="mt-2">Preview not available</p>
                <Button variant="outline" className="mt-4" onClick={() => window.open(previewUrl, '_blank')}>
                  <ExternalLink className="w-4 h-4 mr-2" /> Open
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Job Management</h1>
          <p className="text-muted-foreground mt-1">Create, edit, and delete job posts.</p>
        </div>
        <Button className="rounded-xl h-12 px-6 font-bold gap-2" onClick={openCreate}>
          <Plus className="w-5 h-5" /> Add New Job
        </Button>
      </div>

      {/* Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search jobs, organizations..."
            className="pl-10 h-12 rounded-xl"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load()}
          />
        </div>
        <Button variant="outline" className="rounded-xl h-12 font-bold" onClick={load}>Search</Button>
      </div>

      {/* Jobs Table */}
      <Card className="rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b">
                <th className="px-6 py-4 text-xs font-black uppercase">Job</th>
                <th className="px-6 py-4 text-xs font-black uppercase">Org</th>
                <th className="px-6 py-4 text-xs font-black uppercase">Category</th>
                <th className="px-6 py-4 text-xs font-black uppercase">Ends</th>
                <th className="px-6 py-4 text-xs font-black uppercase">Status</th>
                <th className="px-6 py-4 text-xs font-black uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center">Loading…</td></tr>
              ) : (
                jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-muted/30">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Briefcase className="w-4 h-4 text-primary" />
                        </div>
                        <span className="font-bold text-sm truncate max-w-[200px]">{job.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">{job.organization}</td>
                    <td className="px-6 py-4"><Badge variant="secondary">{job.subCategory}</Badge></td>
                    <td className="px-6 py-4 text-sm">{new Date(job.endAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      {job.status === 'published' ? (
                        <div className="flex items-center gap-1.5 text-green-500 text-xs font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Published
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-orange-500 text-xs font-bold">
                          <Clock className="w-3.5 h-3.5" /> Draft
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-lg size-8 hover:bg-muted">
                          <MoreVertical className="w-4 h-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl w-40">
                          <DropdownMenuItem onClick={() => window.open(`/jobs/${job.id}`, '_blank')}>
                            <Eye className="w-4 h-4 mr-2" /> View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEdit(job)}>
                            <Edit2 className="w-4 h-4 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => setDeleteJobId(job.id)}>
                            <Trash2 className="w-4 h-4 mr-2" /> Delete
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
        <div className="px-6 py-4 bg-muted/20 border-t text-xs text-muted-foreground">
          Showing {jobs.length} of {total}
        </div>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader><DialogTitle>{editingId ? 'Edit job' : 'New job'}</DialogTitle></DialogHeader>
          <div className="grid gap-3 py-2">
            {/* Basic fields */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-xs font-bold">Main category</span>
                <select
                  className="w-full h-10 rounded-lg border mt-1 px-2 text-sm"
                  value={String(form.mainCategory)}
                  onChange={(e) => setForm(f => ({ ...f, mainCategory: e.target.value }))}
                >
                  <option value="government">government</option>
                  <option value="private">private</option>
                  <option value="local">local</option>
                </select>
              </div>
              <div>
                <span className="text-xs font-bold">Sub category</span>
                <Input value={String(form.subCategory)} onChange={(e) => setForm(f => ({ ...f, subCategory: e.target.value }))} className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-xs font-bold">Country (ISO2)</span>
                <Input
                  value={String(form.countryCode)}
                  onChange={(e) => setForm(f => ({ ...f, countryCode: e.target.value.toUpperCase().slice(0, 2) }))}
                  className="mt-1"
                  maxLength={2}
                />
              </div>
              <div>
                <span className="text-xs font-bold">Local area</span>
                <Input value={String(form.localArea)} onChange={(e) => setForm(f => ({ ...f, localArea: e.target.value }))} className="mt-1" />
              </div>
            </div>
            <div>
              <span className="text-xs font-bold">Title</span>
              <Input value={String(form.title)} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <span className="text-xs font-bold">Summary</span>
              <Input value={String(form.summary)} onChange={(e) => setForm(f => ({ ...f, summary: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <span className="text-xs font-bold">Organization</span>
              <Input value={String(form.organization)} onChange={(e) => setForm(f => ({ ...f, organization: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <span className="text-xs font-bold">Description</span>
              <textarea
                className="w-full min-h-[80px] rounded-lg border mt-1 p-2 text-sm"
                value={String(form.description)}
                onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-xs font-bold">Apply URL</span>
                <Input value={String(form.applyUrl)} onChange={(e) => setForm(f => ({ ...f, applyUrl: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <span className="text-xs font-bold">Phone</span>
                <Input value={String(form.phone)} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-xs font-bold">Start</span>
                <Input
                  type="datetime-local"
                  value={String(form.startAt)}
                  onChange={(e) => setForm(f => ({ ...f, startAt: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <span className="text-xs font-bold">End</span>
                <Input
                  type="datetime-local"
                  value={String(form.endAt)}
                  onChange={(e) => setForm(f => ({ ...f, endAt: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>

            {/* ATTACHMENTS SECTION */}
            <div className="border-t pt-3 mt-2">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-bold uppercase">Attachments</span>
                <input
                  type="file"
                  id="multi-upload"
                  className="hidden"
                  multiple
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,application/pdf,application/zip,application/x-zip-compressed"
                  onChange={(e) => handleUploadFiles(e.target.files)}
                  disabled={uploading}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1 text-xs"
                  onClick={() => document.getElementById('multi-upload')?.click()}
                  disabled={uploading}
                >
                  <Upload className="w-3.5 h-3.5" /> {uploading ? 'Uploading...' : 'Add Files'}
                </Button>
              </div>
              {attachments.length === 0 ? (
                <div className="text-center py-6 border border-dashed rounded-lg bg-muted/20">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs text-muted-foreground">No attachments. Click "Add Files" to upload images, PDFs, or ZIP files.</p>
                </div>
              ) : (
                <div className="grid gap-2 max-h-[300px] overflow-y-auto pr-1">
                  {attachments.map((att) => (
                    <div key={att.id} className="flex items-center justify-between p-2 rounded-lg border bg-muted/10 hover:bg-muted/20">
                      <div className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer" onClick={() => openPreview(att)}>
                        {isImage(att.mimeType) ? (
                          <div className="shrink-0 w-10 h-10 rounded-md bg-muted overflow-hidden">
                            <img src={att.url} alt="thumb" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="shrink-0 w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
                            {getFileIcon(att.mimeType)}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{att.name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {att.mimeType.split('/')[1]?.toUpperCase()} • {formatFileSize(att.size)}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 hover:text-destructive"
                        onClick={() => removeAttachment(att)}
                      >
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-[10px] text-muted-foreground mt-2">
                Supported: Images, PDF, ZIP. Max 50MB per file. Click to preview.
              </p>
            </div>

            {/* Alert & Status */}
            <div className="flex items-center gap-2 mt-2">
              <input
                type="checkbox"
                id="alert"
                checked={Boolean(form.alertEnabled)}
                onChange={(e) => setForm(f => ({ ...f, alertEnabled: e.target.checked }))}
              />
              <label htmlFor="alert" className="text-sm font-medium cursor-pointer">Show alert callout</label>
            </div>
            {form.alertEnabled && (
              <div>
                <span className="text-xs font-bold">Alert message</span>
                <Input
                  value={String(form.alertMessage)}
                  onChange={(e) => setForm(f => ({ ...f, alertMessage: e.target.value }))}
                  className="mt-1"
                />
              </div>
            )}
            <div>
              <span className="text-xs font-bold">Status</span>
              <select
                className="w-full h-10 rounded-lg border mt-1 px-2 text-sm"
                value={String(form.status)}
                onChange={(e) => setForm(f => ({ ...f, status: e.target.value }))}
              >
                <option value="published">published</option>
                <option value="draft">draft</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={uploading}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}