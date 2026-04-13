import { Suspense } from 'react';
import GovtJobs from '@/src/views/GovtJobs';

export default function Page() {
  return (
    <Suspense fallback={<div className="pt-32 pb-20 min-h-screen text-center text-muted-foreground">Loading…</div>}>
      <GovtJobs />
    </Suspense>
  );
}
