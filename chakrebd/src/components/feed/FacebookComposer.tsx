'use client';

import React, { useRef, useState } from 'react';
import DOMPurify from 'dompurify';
import { ImagePlus, Loader2, Smile, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { uploadImageBase64 } from '@/lib/api';

type Props = {
  onSubmit: (payload: { body: string; bodyHtml: string | null; imageUrls: string[] }) => void | Promise<void>;
  disabled?: boolean;
  placeholder?: string;
  groupId?: string | null;
  className?: string;
};

export function FacebookComposer({
  onSubmit,
  disabled,
  placeholder = "What's on your mind?",
  className,
}: Props) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [uploading, setUploading] = useState(false);
  const [pendingImages, setPendingImages] = useState<string[]>([]);

  const exec = (cmd: string) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false);
  };

  const getHtml = () => (editorRef.current?.innerHTML || '').trim();
  const getPlain = () => (editorRef.current?.innerText || '').trim();

  const handleSubmit = async () => {
    const rawHtml = getHtml();
    const plain = getPlain();
    const sanitized = rawHtml ? DOMPurify.sanitize(rawHtml) : '';
    const textFromHtml = sanitized.replace(/<[^>]+>/g, '').replace(/\u00a0/g, ' ').trim();
    const bodyHtml =
      textFromHtml === '' && !sanitized.includes('<img') ? null : sanitized || null;
    if (!plain && !bodyHtml && pendingImages.length === 0) return;
    await onSubmit({
      body: plain,
      bodyHtml,
      imageUrls: pendingImages,
    });
    if (editorRef.current) editorRef.current.innerHTML = '';
    setPendingImages([]);
  };

  const onPickImages = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const f of Array.from(files).slice(0, 10)) {
        const b64 = await new Promise<string>((res, rej) => {
          const r = new FileReader();
          r.onload = () => res(String(r.result || ''));
          r.onerror = () => rej(new Error('read'));
          r.readAsDataURL(f);
        });
        const up = await uploadImageBase64(b64);
        if (up.ok) urls.push(up.url);
      }
      setPendingImages((p) => [...p, ...urls]);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className={cn(
        'rounded-xl bg-card shadow-[0_1px_2px_rgba(0,0,0,0.08)] dark:shadow-none border border-border/60 overflow-hidden',
        className
      )}
    >
      <div className="flex items-start gap-3 p-3 border-b border-border/50">
        <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center text-sm font-black text-primary shrink-0">
          You
        </div>
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex flex-wrap gap-1">
            <button
              type="button"
              className="px-2 py-1 text-xs font-bold rounded-md bg-muted/80 hover:bg-muted"
              onClick={() => exec('bold')}
            >
              B
            </button>
            <button
              type="button"
              className="px-2 py-1 text-xs font-bold rounded-md bg-muted/80 hover:bg-muted italic"
              onClick={() => exec('italic')}
            >
              I
            </button>
            <button
              type="button"
              className="px-2 py-1 text-xs font-bold rounded-md bg-muted/80 hover:bg-muted underline"
              onClick={() => exec('underline')}
            >
              U
            </button>
            <span className="text-xs text-muted-foreground flex items-center gap-1 ml-2">
              <Smile className="w-3.5 h-3.5" /> Rich text
            </span>
          </div>
          <div
            ref={editorRef}
            contentEditable={!disabled}
            suppressContentEditableWarning
            className="min-h-[88px] max-h-[280px] overflow-y-auto px-3 py-2 rounded-xl border border-border/50 bg-muted/20 text-[15px] leading-relaxed outline-none focus-visible:ring-2 focus-visible:ring-primary/25 empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground"
            data-placeholder={placeholder}
          />
          {pendingImages.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {pendingImages.map((u) => (
                <div key={u} className="relative group/img">
                  <img src={u} alt="" className="h-24 w-24 object-cover rounded-lg border" />
                  <button
                    type="button"
                    className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-background border text-xs font-bold opacity-0 group-hover/img:opacity-100"
                    onClick={() => setPendingImages((p) => p.filter((x) => x !== u))}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-muted/30">
        <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted/80 text-sm font-semibold text-primary transition-colors">
          <ImagePlus className="w-5 h-5" />
          Photo / video
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => void onPickImages(e.target.files)}
          />
        </label>
        {uploading ? <Loader2 className="w-5 h-5 animate-spin text-primary" /> : null}
        <Button
          type="button"
          className="rounded-lg font-bold px-6"
          disabled={disabled || uploading}
          onClick={() => void handleSubmit()}
        >
          <Send className="w-4 h-4 mr-2" /> Post
        </Button>
      </div>
    </div>
  );
}
