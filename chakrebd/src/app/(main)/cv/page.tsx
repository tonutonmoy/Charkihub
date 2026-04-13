import { redirect } from 'next/navigation';

/** Skip template gallery — open default editor directly (template id `1` = Standard Govt). */
export default function Page() {
  redirect('/cv/edit/1');
}
