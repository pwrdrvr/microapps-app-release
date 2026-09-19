'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { readConsoleVersion } from '@/lib/release-console/links';
import type { ReleaseConsoleSource } from '@/lib/release-console/types';
import { cn } from '@/lib/utils';

/** Which console build is serving this page, read from its asset URLs after hydration. */
export function ConsoleVersionChip() {
  const [version, setVersion] = useState<string | null>(null);

  useEffect(() => {
    setVersion(readConsoleVersion());
  }, []);

  return version ? <span className="rc-chip">console {version}</span> : null;
}

function LoadedAt({ iso }: { iso: string }) {
  // The server clock is UTC; show the operator's local time once hydrated.
  const [label, setLabel] = useState(`${iso.slice(11, 19)} UTC`);

  useEffect(() => {
    setLabel(new Date(iso).toLocaleTimeString([], { hour12: false }));
  }, [iso]);

  return <time dateTime={iso}>loaded {label}</time>;
}

export function ConsoleFooter({
  source,
  healthy,
}: {
  source: ReleaseConsoleSource;
  healthy: boolean;
}) {
  const router = useRouter();
  const [isRefreshing, startRefresh] = useTransition();

  return (
    <footer className="rc-foot">
      <div className="rc-foot-l">
        <span className={cn('rc-status', !healthy && 'is-down')}>
          <span className="rc-dot" />
          DynamoDB
        </span>
        {source.tableName ? <span>{source.tableName}</span> : null}
        {source.loadedAt ? <LoadedAt iso={source.loadedAt} /> : null}
        <button
          type="button"
          className="rc-link-btn"
          onClick={() => startRefresh(() => router.refresh())}
          aria-disabled={isRefreshing}
        >
          {isRefreshing ? '↻ refreshing…' : '↻ refresh'}
        </button>
      </div>
      {source.region ? <span>{source.region}</span> : null}
    </footer>
  );
}
