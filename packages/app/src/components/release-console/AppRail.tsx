'use client';

import { useEffect, useRef, useState, useTransition, type KeyboardEvent } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { ReleaseConsoleApp } from '@/lib/release-console/types';
import { cn } from '@/lib/utils';

function matchesFilter(app: ReleaseConsoleApp, query: string) {
  if (query.length === 0) {
    return true;
  }

  const normalizedQuery = query.toLowerCase();
  return (
    app.appName.toLowerCase().includes(normalizedQuery) ||
    app.displayName.toLowerCase().includes(normalizedQuery)
  );
}

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return (
    target.isContentEditable ||
    ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) ||
    target.closest('[role="dialog"]') !== null
  );
}

export function AppRail({
  apps,
  selectedAppName,
  focusShortcut = false,
  onSelected,
}: {
  apps: ReleaseConsoleApp[];
  selectedAppName: string | null;
  /** Bind `/` to the filter. Only one rail on the page should claim it. */
  focusShortcut?: boolean;
  onSelected?: (appName: string) => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const [pendingAppName, setPendingAppName] = useState<string | null>(null);
  const [isNavigating, startNavigation] = useTransition();

  const trimmedQuery = query.trim();
  const filteredApps = apps.filter((app) => matchesFilter(app, trimmedQuery));
  const shownSelection = isNavigating && pendingAppName ? pendingAppName : selectedAppName;

  useEffect(() => {
    if (!focusShortcut) {
      return;
    }

    function focusFilter(event: globalThis.KeyboardEvent) {
      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }

      if (isTypingTarget(event.target)) {
        return;
      }

      event.preventDefault();
      inputRef.current?.focus();
      inputRef.current?.select();
    }

    document.addEventListener('keydown', focusFilter);
    return () => document.removeEventListener('keydown', focusFilter);
  }, [focusShortcut]);

  function selectApp(appName: string) {
    onSelected?.(appName);
    if (appName === selectedAppName) {
      return;
    }

    const params = new URLSearchParams(searchParams?.toString() ?? '');
    params.set('app', appName);
    setPendingAppName(appName);
    startNavigation(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    });
  }

  function onFilterKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, filteredApps.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === 'Enter') {
      const app = filteredApps[activeIndex >= 0 ? activeIndex : 0];
      if (app) {
        event.preventDefault();
        selectApp(app.appName);
      }
    } else if (event.key === 'Escape' && query) {
      event.preventDefault();
      event.stopPropagation();
      setQuery('');
      setActiveIndex(-1);
    }
  }

  return (
    <div className="rc-rail">
      <div className="rc-side-head">
        <span className="rc-eyebrow">Apps</span>
        <span className="rc-count">{apps.length}</span>
      </div>

      <label className="rc-input">
        <span className="rc-glyph" aria-hidden>
          ⌕
        </span>
        <input
          ref={inputRef}
          aria-label="Filter apps"
          placeholder="Filter apps"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(event.target.value.trim() ? 0 : -1);
          }}
          onKeyDown={onFilterKeyDown}
        />
        {focusShortcut ? (
          <span className="rc-kbd" aria-hidden>
            /
          </span>
        ) : null}
      </label>

      <nav className="rc-applist" aria-label="Apps">
        {filteredApps.map((app, index) => {
          const isSelected = app.appName === shownSelection;

          return (
            <button
              key={app.appName}
              type="button"
              className={cn(
                'rc-app-btn',
                isSelected && 'is-sel',
                index === activeIndex && 'is-active',
              )}
              aria-current={isSelected ? 'page' : undefined}
              onClick={() => selectApp(app.appName)}
            >
              <span className="rc-app-name">{app.displayName}</span>
              {app.newerRelease ? (
                <span
                  className="rc-up"
                  title={`${app.newerRelease} is newer than the live default`}
                >
                  ↑ {app.newerRelease}
                </span>
              ) : null}
              <span className="rc-app-ver">{app.liveVersion ?? '—'}</span>
            </button>
          );
        })}

        {filteredApps.length === 0 ? (
          <div className="rc-empty">
            {apps.length === 0 ? 'No apps are registered.' : `No apps match “${trimmedQuery}”.`}
          </div>
        ) : null}
      </nav>

      <div className="rc-side-foot" aria-hidden>
        <span className="rc-hint">
          <span className="rc-kbd">/</span> filter
        </span>
        <span className="rc-hint">
          <span className="rc-kbd">↑↓</span> move
        </span>
        <span className="rc-hint">
          <span className="rc-kbd">↵</span> open
        </span>
      </div>
    </div>
  );
}
