import { Suspense } from 'react';
import Suggestions from '@/src/views/Suggestions';

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="pt-32 pb-20 min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>
      }
    >
      <Suggestions />
    </Suspense>
  );
}
