'use client';

import { useRef, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import type { ReleaseConsoleApp } from '@/lib/release-console/types';
import { AppRail } from './AppRail';

/** The app rail as a bottom sheet, for screens too narrow to show it alongside. */
export function AppPicker({
  apps,
  selectedAppName,
  selectedAppDisplayName,
}: {
  apps: ReleaseConsoleApp[];
  selectedAppName: string | null;
  selectedAppDisplayName: string | null;
}) {
  const [open, setOpen] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger className="rc-m-switch">
        <span className="rc-eyebrow">App</span>
        <span className="rc-app-name">{selectedAppDisplayName ?? 'Choose an app'}</span>
        <span className="rc-app-ver">{apps.length} apps ▾</span>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="rc-scrim" />
        <Dialog.Content
          ref={sheetRef}
          className="rc rc-sheet"
          aria-describedby={undefined}
          // Focusing the filter would raise the phone keyboard over the list.
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            sheetRef.current?.focus();
          }}
        >
          <div className="rc-handle" />
          <Dialog.Title className="sr-only">Choose an app</Dialog.Title>
          <AppRail
            apps={apps}
            selectedAppName={selectedAppName}
            onSelected={() => setOpen(false)}
          />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
