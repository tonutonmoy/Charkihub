'use client';

import { Suspense } from 'react';
import CVEditor from '@/src/views/CVEditor';

export default function Page() {
  return (
    <Suspense fallback={<div className="pt-32 pb-20 min-h-screen flex items-center justify-center text-muted-foreground">লোড হচ্ছে…</div>}>
      <CVEditor />
    </Suspense>
  );
}
