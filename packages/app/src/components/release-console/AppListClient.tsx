'use client';

import { useDeferredValue, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Box, ChevronsRight } from 'lucide-react';
import type { ReleaseConsoleApp } from '@/lib/release-console/types';
import { cn } from '@/lib/utils';
import { SearchInput } from './SearchInput';

function appFilter(app: ReleaseConsoleApp, query: string) {
  if (query.length === 0) {
    return true;
  }

  const normalizedQuery = query.toLowerCase();
  return (
    app.appName.toLowerCase().includes(normalizedQuery) ||
    app.displayName.toLowerCase().includes(normalizedQuery)
  );
}

export function AppListClient({
  apps,
  selectedAppName,
}: {
  apps: ReleaseConsoleApp[];
  selectedAppName: string | null;
}) {
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filteredApps = apps.filter((app) => appFilter(app, deferredQuery));

  function selectApp(appName: string) {
    const params = new URLSearchParams(searchParams?.toString() ?? '');
    params.set('app', appName);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="panel-surface flex h-full flex-col gap-5 p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="panel-label">App Index</p>
          <h2 className="mt-2 text-lg font-semibold text-foreground">Browse releases</h2>
        </div>
        <div className="data-chip">{apps.length} apps</div>
      </div>

      <SearchInput value={query} onChange={setQuery} />

      <div className="grid gap-2">
        {filteredApps.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/80 bg-panelAlt/60 px-4 py-6 text-sm text-muted">
            No apps matched <span className="font-mono text-foreground">{query}</span>.
          </div>
        ) : null}

        {filteredApps.map((app) => {
          const isSelected = app.appName === selectedAppName;

          return (
            <button
              key={app.appName}
              type="button"
              onClick={() => selectApp(app.appName)}
              className={cn(
                'flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition',
                isSelected
                  ? 'border-accent/60 bg-accent/10 text-foreground'
                  : 'border-border bg-panelAlt/55 text-muted hover:border-accent/40 hover:text-foreground',
              )}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Box className="h-4 w-4 shrink-0" />
                  <p className="truncate font-medium">{app.displayName}</p>
                </div>
                <p className="mt-1 truncate font-mono text-[0.7rem] uppercase tracking-[0.2em] text-muted">
                  {app.appName}
                </p>
              </div>
              <ChevronsRight
                className={cn('h-4 w-4 shrink-0', isSelected ? 'text-accent' : 'text-muted')}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
