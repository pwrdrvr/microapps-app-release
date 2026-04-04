'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { ReleaseConsoleVersion } from '@/lib/release-console/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const appBasePath = '/release';

export function ConfirmDefaultChange({
  open,
  onOpenChange,
  appName,
  currentDefaultVersion,
  nextVersion,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appName: string;
  currentDefaultVersion: string | null;
  nextVersion: ReleaseConsoleVersion | null;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function confirmChange() {
    if (!nextVersion) {
      return;
    }

    setError(null);

    startTransition(async () => {
      const response = await fetch(`${appBasePath}/api/default-version`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({ appName, semVer: nextVersion.semVer }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(payload?.error ?? 'Unable to update the default version.');
        return;
      }

      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <p className="panel-label">Confirm Change</p>
          <DialogTitle>Promote {nextVersion?.semVer ?? 'this version'}?</DialogTitle>
          <DialogDescription>
            The version switch does nothing until you confirm it here. This keeps the main screen
            fast to scan without making release changes feel accidental.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-2xl border border-border bg-panelAlt/80 p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="panel-label">App</p>
              <p className="mt-2 font-mono text-sm text-foreground">{appName}</p>
            </div>
            <div>
              <p className="panel-label">Current Default</p>
              <p className="mt-2 font-mono text-sm text-foreground">
                {currentDefaultVersion ?? 'unset'}
              </p>
            </div>
            <div>
              <p className="panel-label">Next Default</p>
              <p className="mt-2 font-mono text-sm text-accent">{nextVersion?.semVer ?? 'n/a'}</p>
            </div>
            <div>
              <p className="panel-label">Route</p>
              <p className="mt-2 font-mono text-sm text-foreground">
                {nextVersion ? `${nextVersion.type} / ${nextVersion.startupType}` : 'n/a'}
              </p>
            </div>
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-danger/50 bg-danger/10 px-4 py-3 text-sm text-danger">
            {error}
          </div>
        ) : null}

        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={confirmChange} disabled={!nextVersion || isPending}>
            {isPending ? 'Promoting' : 'Confirm Default'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
