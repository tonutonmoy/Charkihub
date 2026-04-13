import { Suspense } from 'react';
import Community from '@/src/views/Community';

export default function Page() {
  return (
    <Suspense fallback={<div className="pt-32 text-center text-muted-foreground">Loading…</div>}>
      <Community />
    </Suspense>
  );
}
