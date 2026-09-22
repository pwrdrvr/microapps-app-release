'use client';

import { useEffect, useState } from 'react';
import type { ReleaseConsoleVersion } from '@/lib/release-console/types';
import { buildLambdaConsoleUrl, buildVersionPreviewUrl } from '@/lib/release-console/links';
import {
  actionVerb,
  changeDirection,
  isPrBuild,
  relationLabel,
  routeLabel,
  statusTone,
} from '@/lib/release-console/version-labels';
import { cn } from '@/lib/utils';

function prereleaseCount(versions: ReleaseConsoleVersion[]) {
  const noun = versions.every((version) => isPrBuild(version.semVer))
    ? 'PR build'
    : 'prerelease build';
  return `${versions.length} ${noun}${versions.length === 1 ? '' : 's'}`;
}

function StatusCell({ version }: { version: ReleaseConsoleVersion }) {
  const tone = statusTone(version.status);

  return (
    <span
      className={cn('rc-status', tone === 'waiting' && 'is-waiting', tone === 'down' && 'is-down')}
    >
      <span className="rc-dot" />
      {version.status}
    </span>
  );
}

function CopyUrlButton({ version }: { version: ReleaseConsoleVersion }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) {
      return;
    }

    const timer = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(timer);
  }, [copied]);

  if (!version.url) {
    return <span className="rc-icon is-off" aria-hidden />;
  }

  return (
    <button
      type="button"
      className="rc-icon"
      title={copied ? 'Copied' : 'Copy function URL'}
      aria-label={`Copy the function URL for ${version.semVer}`}
      onClick={() => {
        void navigator.clipboard?.writeText(version.url).then(() => setCopied(true));
      }}
    >
      {copied ? '✓' : '⧉'}
    </button>
  );
}

function VersionRow({
  appName,
  version,
  live,
  isFlashing,
  isTarget,
  onAction,
}: {
  appName: string;
  version: ReleaseConsoleVersion;
  live: ReleaseConsoleVersion | null;
  isFlashing: boolean;
  isTarget: boolean;
  onAction: (version: ReleaseConsoleVersion) => void;
}) {
  const isLive = version.relation === 'live';
  const lambdaConsoleUrl = buildLambdaConsoleUrl(version.lambdaArn);
  const routeChanged =
    live !== null && (version.type !== live.type || version.startupType !== live.startupType);
  const verb = actionVerb(version);
  const blockedReason = version.promotable
    ? null
    : `${version.semVer} is ${version.status} and cannot serve traffic yet`;

  return (
    <div
      role="row"
      className={cn(
        'rc-tr',
        isLive && 'is-live',
        isLive && isFlashing && 'is-flash',
        isTarget && 'is-target',
      )}
    >
      <div role="rowheader" className="rc-vcell">
        <div className="rc-vline">
          <span className="rc-ver">{version.semVer}</span>
          {isLive ? <span className="rc-tag live">LIVE</span> : null}
          {version.relation === 'newer' ? <span className="rc-tag newer">NEWER</span> : null}
          {version.isPrerelease ? (
            <span className="rc-tag pre">{isPrBuild(version.semVer) ? 'PR BUILD' : 'PRE'}</span>
          ) : null}
        </div>
        <div className="rc-m-meta">
          {version.status} · {routeLabel(version)}
          {isLive ? null : ` · ${relationLabel(version)}`}
        </div>
      </div>
      <span role="cell" className="rc-col-status">
        <StatusCell version={version} />
      </span>
      <span role="cell" className="rc-route rc-col-route">
        {routeChanged ? <em>{routeLabel(version)}</em> : routeLabel(version)}
      </span>
      <span
        role="cell"
        className={cn(
          'rc-rel rc-col-rel',
          version.relation === 'newer' && 'newer',
          isLive && 'live',
        )}
      >
        {relationLabel(version)}
      </span>
      <div role="cell" className="rc-actions">
        <a
          className="rc-icon"
          href={buildVersionPreviewUrl(appName, version.semVer)}
          target="_blank"
          rel="noreferrer"
          title="Preview with ?appver"
          aria-label={`Preview ${version.semVer}`}
        >
          ↗
        </a>
        {lambdaConsoleUrl ? (
          <a
            className="rc-icon"
            href={lambdaConsoleUrl}
            target="_blank"
            rel="noreferrer"
            title="Lambda console"
            aria-label={`Open ${version.semVer} in the Lambda console`}
          >
            λ
          </a>
        ) : (
          <span className="rc-icon is-off" aria-hidden />
        )}
        <CopyUrlButton version={version} />
        <div className="rc-act">
          {isLive ? null : (
            <button
              type="button"
              className={cn('rc-btn', changeDirection(version) === 'forward' && 'primary')}
              aria-disabled={blockedReason ? true : undefined}
              title={blockedReason ?? undefined}
              aria-label={`${verb} ${version.semVer}`}
              onClick={() => {
                if (!blockedReason) {
                  onAction(version);
                }
              }}
            >
              {verb}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function VersionList({
  tableRef,
  appName,
  versions,
  flashLive,
  targetSemVer,
  onAction,
}: {
  /** The split handle measures this to know what space the two lists share. */
  tableRef?: React.Ref<HTMLDivElement>;
  appName: string;
  versions: ReleaseConsoleVersion[];
  flashLive: boolean;
  targetSemVer: string | null;
  onAction: (version: ReleaseConsoleVersion) => void;
}) {
  const releases = versions.filter((version) => !version.isPrerelease);
  const prereleases = versions.filter((version) => version.isPrerelease);
  // A lens that would show nothing is not a useful default.
  const [showPrereleases, setShowPrereleases] = useState(releases.length === 0);
  const live = versions.find((version) => version.relation === 'live') ?? null;
  // The live version stays visible even when it is a prerelease the lens would hide.
  const hiddenPrereleases = showPrereleases
    ? []
    : prereleases.filter((version) => version.relation !== 'live');
  const visible = versions.filter((version) => !hiddenPrereleases.includes(version));

  const summary = [
    `${releases.length} ${releases.length === 1 ? 'release' : 'releases'}`,
    prereleases.length ? prereleaseCount(prereleases) : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <>
      <div className="rc-bar">
        <div className="rc-bar-l">
          <span className="rc-eyebrow">Versions</span>
          <span className="rc-count">{summary}</span>
        </div>
        {prereleases.length ? (
          <div className="rc-lens" role="group" aria-label="Versions to show">
            <button
              type="button"
              className="rc-lens-btn"
              aria-pressed={!showPrereleases}
              onClick={() => setShowPrereleases(false)}
            >
              Releases <span className="rc-lens-n">{releases.length}</span>
            </button>
            <button
              type="button"
              className="rc-lens-btn"
              aria-pressed={showPrereleases}
              onClick={() => setShowPrereleases(true)}
            >
              All <span className="rc-lens-n">{versions.length}</span>
            </button>
          </div>
        ) : null}
      </div>

      <div className="rc-table" ref={tableRef} role="table" aria-label={`${appName} versions`}>
        <div role="row" className="rc-tr rc-th">
          <span role="columnheader">Version</span>
          <span role="columnheader" className="rc-col-status">
            Status
          </span>
          <span role="columnheader" className="rc-col-route">
            Route
          </span>
          <span role="columnheader" className="rc-col-rel">
            vs live
          </span>
          <span role="columnheader">
            <span className="sr-only">Actions</span>
          </span>
        </div>

        {visible.map((version) => (
          <VersionRow
            key={version.semVer}
            appName={appName}
            version={version}
            live={live}
            isFlashing={flashLive}
            isTarget={version.semVer === targetSemVer}
            onAction={onAction}
          />
        ))}

        {versions.length === 0 ? (
          <div role="row">
            <div role="cell" className="rc-none">
              No versions are deployed for {appName}.
            </div>
          </div>
        ) : null}

        {hiddenPrereleases.length ? (
          <div role="row">
            <div role="cell">
              <button type="button" className="rc-more" onClick={() => setShowPrereleases(true)}>
                <b>+ {prereleaseCount(hiddenPrereleases)} hidden</b>
                <span>{hiddenPrereleases.map((version) => version.semVer).join(', ')}</span>
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}
