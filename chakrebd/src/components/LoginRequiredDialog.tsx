'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
};

export function LoginRequiredDialog({
  open,
  onOpenChange,
  title = 'Sign in required',
  description = 'You need to be logged in to do this. Please sign in to continue.',
}: Props) {
  const router = useRouter();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" className="rounded-xl" onClick={() => onOpenChange(false)}>
            Not now
          </Button>
          <Button
            type="button"
            className="rounded-xl"
            onClick={() => {
              onOpenChange(false);
              router.push('/login');
            }}
          >
            Sign in
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
