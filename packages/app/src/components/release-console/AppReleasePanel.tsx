'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { ReleaseConsoleRule, ReleaseConsoleVersion } from '@/lib/release-console/types';
import { postDefaultVersion } from '@/lib/release-console/default-version-client';
import { buildAppOpenUrl } from '@/lib/release-console/links';
import { appPath, routeLabel, statusTone } from '@/lib/release-console/version-labels';
import { cn } from '@/lib/utils';
import {
  ConfirmDefaultChange,
  type AppliedDefaultChange,
  type DefaultChangeRequest,
} from './ConfirmDefaultChange';
import { RulesPanel } from './RulesPanel';
import { SplitHandle, useRulesHeight } from './SplitHandle';
import { VersionList } from './VersionList';

function formatClock(date: Date) {
  return date.toLocaleTimeString([], { hour12: false });
}

function ChangeBanner({
  appName,
  change,
  error,
  onDismiss,
  onReverted,
  onRevertFailed,
}: {
  appName: string;
  change: AppliedDefaultChange;
  error: string | null;
  onDismiss: () => void;
  onReverted: (change: AppliedDefaultChange) => void;
  onRevertFailed: (error: string | null) => void;
}) {
  const router = useRouter();
  const [isReverting, startRevert] = useTransition();
  const revertTo = change.from;

  function revert() {
    if (revertTo === null || isReverting) {
      return;
    }

    onRevertFailed(null);
    startRevert(async () => {
      const result = await postDefaultVersion({
        appName,
        semVer: revertTo,
        expectedDefault: change.to,
      });

      startRevert(() => {
        if (result.ok) {
          onReverted({ from: change.to, to: revertTo, at: new Date() });
        } else {
          onRevertFailed(result.error);
        }

        router.refresh();
      });
    });
  }

  return (
    <div className="rc-banner" role="status">
      <span className="rc-dot" />
      <div className="rc-banner-text">
        <code>{appName}</code> now serves <code>{change.to}</code>
        {change.from ? (
          <>
            {' '}
            — was <code>{change.from}</code>
          </>
        ) : null}
        {/* Without this, an edge router still inside its 60s rule cache looks like a failed
            write, and the natural reaction is to change the default again. */}
        <span className="rc-banner-note">
          Edge routers cache rules for up to 60s, so <code>{appPath(appName)}</code> can serve the
          old version until then.
        </span>
      </div>
      <span className="rc-banner-time">{formatClock(change.at)}</span>
      {revertTo ? (
        <button
          type="button"
          className="rc-btn on-success"
          onClick={revert}
          aria-disabled={isReverting}
        >
          {isReverting ? 'Reverting…' : `Revert to ${revertTo}`}
        </button>
      ) : null}
      <button type="button" className="rc-x" onClick={onDismiss} aria-label="Dismiss">
        ✕
      </button>
      {error ? <div className="rc-banner-error">{error}</div> : null}
    </div>
  );
}

export function AppReleasePanel({
  appName,
  displayName,
  versions,
  rules,
  defaultVersion,
}: {
  appName: string;
  displayName: string;
  versions: ReleaseConsoleVersion[];
  rules: ReleaseConsoleRule[];
  defaultVersion: string | null;
}) {
  const [request, setRequest] = useState<DefaultChangeRequest | null>(null);
  const [applied, setApplied] = useState<AppliedDefaultChange | null>(null);
  // Held here, not in the banner: a refused revert (409) refreshes to a default the
  // banner no longer describes, which unmounts it along with anything it held.
  const [revertError, setRevertError] = useState<string | null>(null);
  const [rulesHeight, setRulesHeight] = useRulesHeight();
  const versionsRef = useRef<HTMLDivElement>(null);
  const rulesRef = useRef<HTMLElement>(null);

  const live = versions.find((version) => version.relation === 'live') ?? null;
  // Only claim a change while the data still shows it; if the default has moved on
  // since, the banner (and its revert) would be describing a state that is gone.
  const visibleChange = applied && applied.to === defaultVersion ? applied : null;
  const liveTone = live ? statusTone(live.status) : 'down';

  return (
    <div className="rc-pane">
      <div className="rc-head">
        <div>
          <h1 className="rc-h">{displayName}</h1>
          <div className="rc-sub">
            <a href={buildAppOpenUrl(appName)} target="_blank" rel="noreferrer">
              {appPath(appName)} ↗
            </a>
          </div>
        </div>

        <div className="rc-live">
          <div className="rc-live-cell">
            <span className="rc-eyebrow">Live default</span>
            <span className={cn('rc-live-v', defaultVersion === null && 'is-unset')}>
              {defaultVersion ?? 'unset'}
            </span>
            {defaultVersion ? (
              <span
                className={cn(
                  'rc-status rc-live-meta',
                  liveTone === 'waiting' && 'is-waiting',
                  liveTone === 'down' && 'is-down',
                )}
              >
                <span className="rc-dot" />
                {live ? `${live.status} · ${routeLabel(live)}` : 'version record missing'}
              </span>
            ) : null}
          </div>
          <div className="rc-live-cell is-extra">
            <span className="rc-eyebrow">Route</span>
            <span className="rc-live-m">{live ? routeLabel(live) : '—'}</span>
          </div>
          <div className="rc-live-cell is-extra">
            <span className="rc-eyebrow">Status</span>
            {defaultVersion ? (
              <span
                className={cn(
                  'rc-status',
                  liveTone === 'waiting' && 'is-waiting',
                  liveTone === 'down' && 'is-down',
                )}
                title={live ? undefined : `No version record exists for ${defaultVersion}`}
              >
                <span className="rc-dot" />
                {live ? live.status : 'missing'}
              </span>
            ) : (
              <span className="rc-live-m">—</span>
            )}
          </div>
          <a
            className="rc-btn rc-live-open"
            href={buildAppOpenUrl(appName)}
            target="_blank"
            rel="noreferrer"
          >
            Open ↗
          </a>
        </div>
      </div>

      {visibleChange ? (
        <ChangeBanner
          appName={appName}
          change={visibleChange}
          error={revertError}
          onDismiss={() => {
            setApplied(null);
            setRevertError(null);
          }}
          onReverted={setApplied}
          onRevertFailed={setRevertError}
        />
      ) : revertError ? (
        <div className="rc-note danger rc-alert" role="alert">
          Revert not applied: {revertError}
        </div>
      ) : null}

      <VersionList
        tableRef={versionsRef}
        appName={appName}
        versions={versions}
        flashLive={visibleChange !== null}
        targetSemVer={request?.target.semVer ?? null}
        onAction={(target) => setRequest({ target, expectedDefault: defaultVersion })}
      />

      <SplitHandle
        height={rulesHeight}
        onResize={setRulesHeight}
        listRef={versionsRef}
        panelRef={rulesRef}
      />

      <RulesPanel
        ref={rulesRef}
        height={rulesHeight}
        rules={rules}
        versions={versions}
        onPickVersion={(target) => setRequest({ target, expectedDefault: defaultVersion })}
      />

      {request ? (
        <ConfirmDefaultChange
          key={`${request.target.semVer}|${request.expectedDefault}`}
          appName={appName}
          request={request}
          live={live}
          onClose={() => setRequest(null)}
          onApplied={(change) => {
            setApplied(change);
            setRevertError(null);
            setRequest(null);
          }}
        />
      ) : null}
    </div>
  );
}
