'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'rc-rules-height';
/** Below this the rules panel is not worth showing; the handle snaps back to auto. */
export const MIN_RULES_HEIGHT = 72;
/**
 * Leave the versions list at least this much, however far the handle is dragged.
 * release-console.css enforces the same floor for a stored height from a taller window.
 */
const MIN_VERSIONS_HEIGHT = 160;
const KEYBOARD_STEP = 24;

function clamp(height: number, available: number) {
  return Math.max(MIN_RULES_HEIGHT, Math.min(height, available));
}

/**
 * Remembers the operator's split. Browser storage is per-viewer and can throw or come
 * back empty (private windows, cleared site data), so every access is guarded and the
 * panel renders correctly at its content height when nothing is stored.
 */
export function useRulesHeight() {
  const [height, setHeight] = useState<number | null>(null);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === null) {
        return;
      }

      const parsed = Number.parseInt(stored, 10);
      if (Number.isFinite(parsed) && parsed >= MIN_RULES_HEIGHT) {
        setHeight(parsed);
      }
    } catch {
      // No stored preference is a fine state to be in.
    }
  }, []);

  const store = useCallback((next: number | null) => {
    setHeight(next);
    try {
      if (next === null) {
        window.localStorage.removeItem(STORAGE_KEY);
      } else {
        window.localStorage.setItem(STORAGE_KEY, String(next));
      }
    } catch {
      // The split still applies for this page view.
    }
  }, []);

  return [height, store] as const;
}

export function SplitHandle({
  height,
  onResize,
  listRef,
  panelRef,
}: {
  height: number | null;
  onResize: (height: number | null) => void;
  listRef: React.RefObject<HTMLElement | null>;
  panelRef: React.RefObject<HTMLElement | null>;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const drag = useRef<{ startY: number; startHeight: number } | null>(null);

  // The two lists share one vertical region, so the rules panel can grow into
  // whatever the versions list can spare. Measuring both is the only way to know
  // that; the pane's own height would also count the header above them.
  const available = useCallback(() => {
    const list = listRef.current;
    const panel = panelRef.current;
    if (!list || !panel) {
      return Number.POSITIVE_INFINITY;
    }

    const shared = list.getBoundingClientRect().height + panel.getBoundingClientRect().height;
    const max = shared - MIN_VERSIONS_HEIGHT;
    // With no usable layout — a hidden pane, or a test environment — an upper
    // bound would be a guess, and guessing pins the handle to its floor.
    return max > MIN_RULES_HEIGHT ? max : Number.POSITIVE_INFINITY;
  }, [listRef, panelRef]);

  // Dragging starts from whatever the panel measures now, so grabbing the handle
  // never makes the panel jump before the pointer has moved.
  const currentHeight = useCallback(() => {
    return height ?? panelRef.current?.getBoundingClientRect().height ?? MIN_RULES_HEIGHT;
  }, [height, panelRef]);

  function startDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { startY: event.clientY, startHeight: currentHeight() };
    setIsDragging(true);
  }

  function moveDrag(event: React.PointerEvent<HTMLDivElement>) {
    const start = drag.current;
    if (!start) {
      return;
    }

    // The handle sits above the panel, so dragging up must make the panel taller.
    onResize(clamp(start.startHeight - (event.clientY - start.startY), available()));
  }

  function endDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (!drag.current) {
      return;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    drag.current = null;
    setIsDragging(false);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const step = event.shiftKey ? KEYBOARD_STEP * 3 : KEYBOARD_STEP;
    const limit = available();

    if (event.key === 'ArrowUp') {
      onResize(clamp(currentHeight() + step, limit));
    } else if (event.key === 'ArrowDown') {
      onResize(clamp(currentHeight() - step, limit));
    } else if (event.key === 'Home') {
      onResize(MIN_RULES_HEIGHT);
    } else if (event.key === 'End') {
      onResize(clamp(limit, limit));
    } else if (event.key === 'Enter' || event.key === ' ') {
      onResize(null);
    } else {
      return;
    }

    event.preventDefault();
  }

  return (
    <div
      role="separator"
      tabIndex={0}
      aria-orientation="horizontal"
      aria-label="Resize the rules panel"
      aria-valuenow={height === null ? undefined : Math.round(height)}
      aria-valuemin={MIN_RULES_HEIGHT}
      className={cn('rc-split', isDragging && 'is-drag')}
      title="Drag to resize · double-click to reset"
      onPointerDown={startDrag}
      onPointerMove={moveDrag}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onDoubleClick={() => onResize(null)}
      onKeyDown={onKeyDown}
    />
  );
}
