'use client';

import { useState, useTransition } from 'react';
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
import { VersionList } from './VersionList';

function formatClock(date: Date) {
  return date.toLocaleTimeString([], { hour12: false });
}

function AttributeRules({ rules }: { rules: ReleaseConsoleRule[] }) {
  const attributeRules = rules.filter((rule) => rule.key !== 'default');
  if (attributeRules.length === 0) {
    return <span>no attribute rules</span>;
  }

  return (
    <>
      {attributeRules.map((rule) => (
        <span key={rule.key} className="rc-rule">
          rule <b>{rule.key}</b> → {rule.semVer}
          {rule.attributeName ? ` (${rule.attributeName}=${rule.attributeValue})` : ''}
        </span>
      ))}
    </>
  );
}

function ChangeBanner({
  appName,
  change,
  onDismiss,
  onReverted,
}: {
  appName: string;
  change: AppliedDefaultChange;
  onDismiss: () => void;
  onReverted: (change: AppliedDefaultChange) => void;
}) {
  const router = useRouter();
  const [isReverting, startRevert] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const revertTo = change.from;

  function revert() {
    if (revertTo === null || isReverting) {
      return;
    }

    setError(null);
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
          setError(result.error);
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
            <span className="rc-sep">/</span>
            <span className="rc-rule">
              rule <b>default</b> → {defaultVersion ?? 'unset'}
            </span>
            <span className="rc-sep">/</span>
            <AttributeRules rules={rules} />
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
          onDismiss={() => setApplied(null)}
          onReverted={setApplied}
        />
      ) : null}

      <VersionList
        appName={appName}
        versions={versions}
        flashLive={visibleChange !== null}
        targetSemVer={request?.target.semVer ?? null}
        onAction={(target) => setRequest({ target, expectedDefault: defaultVersion })}
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
            setRequest(null);
          }}
        />
      ) : null}
    </div>
  );
}
