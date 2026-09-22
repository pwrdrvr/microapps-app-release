'use client';

import { useId, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import * as Dialog from '@radix-ui/react-dialog';
import type { ReleaseConsoleVersion } from '@/lib/release-console/types';
import { postDefaultVersion } from '@/lib/release-console/default-version-client';
import { buildVersionPreviewUrl } from '@/lib/release-console/links';
import {
  appPath,
  changeDirection,
  prereleaseKind,
  routeLabel,
} from '@/lib/release-console/version-labels';
import { cn } from '@/lib/utils';

export interface DefaultChangeRequest {
  target: ReleaseConsoleVersion;
  /** The live default when the operator opened the dialog; the write is conditional on it. */
  expectedDefault: string | null;
}

export interface AppliedDefaultChange {
  from: string | null;
  to: string;
  at: Date;
}

// The console serves itself: changing its own default changes this page.
const SELF_APP_NAME = 'release';

function describeBetween(request: DefaultChangeRequest) {
  const { target } = request;
  if (target.isPrerelease) {
    return 'n/a — not a release';
  }

  if (request.expectedDefault === null) {
    return 'n/a — no live default';
  }

  return target.between.length ? target.between.join(', ') : 'nothing — adjacent release';
}

export function ConfirmDefaultChange({
  appName,
  request,
  live,
  onClose,
  onApplied,
}: {
  appName: string;
  request: DefaultChangeRequest;
  /** The live default's version record, if it is still deployed. */
  live: ReleaseConsoleVersion | null;
  onClose: () => void;
  onApplied: (change: AppliedDefaultChange) => void;
}) {
  const router = useRouter();
  const ackId = useId();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [conflictDefault, setConflictDefault] = useState<string | null | undefined>(undefined);
  const [acknowledged, setAcknowledged] = useState(false);

  const { target, expectedDefault } = request;
  const direction = changeDirection(target);
  const isConflict = conflictDefault !== undefined;
  const path = appPath(appName);
  const previewUrl = buildVersionPreviewUrl(appName, target.semVer);
  const routeChanged =
    live !== null && (target.type !== live.type || target.startupType !== live.startupType);
  const needsAck = target.isPrerelease;
  const blocked = isPending || (needsAck && !acknowledged);

  const verbs = {
    forward: { eyebrow: 'Promote', pending: 'Promoting…', confirm: `Promote ${target.semVer}` },
    back: {
      eyebrow: 'Roll back',
      pending: 'Rolling back…',
      confirm: `Roll back to ${target.semVer}`,
    },
    prerelease: {
      eyebrow: prereleaseKind(target.semVer),
      pending: 'Switching…',
      confirm: `Make ${target.semVer} default`,
    },
    set: {
      eyebrow: 'Set default',
      pending: 'Switching…',
      confirm: `Make ${target.semVer} default`,
    },
  }[direction];

  const title = isConflict
    ? 'The default moved. Nothing was written.'
    : {
        forward: `Promote ${appName} to ${target.semVer}?`,
        back: `Roll back ${appName} to ${target.semVer}?`,
        prerelease: `Serve ${prereleaseKind(target.semVer)} ${
          target.semVer
        } as the ${appName} default?`,
        set: `Make ${target.semVer} the ${appName} default?`,
      }[direction];

  const lede = isConflict
    ? `You picked ${target.semVer} while ${
        expectedDefault ?? 'no default'
      } was live, but ${appName} now serves ${conflictDefault ?? 'no default'}.`
    : `Requests to ${path} without an appver switch to ${target.semVer}.`;

  function confirm() {
    if (blocked || isConflict) {
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await postDefaultVersion({
        appName,
        semVer: target.semVer,
        expectedDefault,
      });

      startTransition(() => {
        if (result.ok) {
          onApplied({ from: expectedDefault, to: target.semVer, at: new Date() });
          router.refresh();
          return;
        }

        if (result.status === 409) {
          // Someone else moved the default; pull the new state in behind the dialog.
          setConflictDefault(result.actualDefault ?? null);
          router.refresh();
          return;
        }

        setError(result.error);
      });
    });
  }

  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open && !isPending) {
          onClose();
        }
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="rc-scrim" />
        <Dialog.Content className="rc rc-dialog" aria-busy={isPending}>
          {isPending ? <div className="rc-sweep" /> : null}
          <div className="rc-handle" />
          <div className="rc-dlg-head">
            <div
              className={cn(
                'rc-eyebrow rc-dlg-eyebrow',
                isConflict ? 'danger' : target.isPrerelease && 'warn',
              )}
            >
              {isConflict ? 'Stale default' : verbs.eyebrow} · {appName}
            </div>
            <Dialog.Title className="rc-dlg-title">{title}</Dialog.Title>
            <Dialog.Description className="rc-dlg-lede">{lede}</Dialog.Description>
          </div>

          <div className="rc-diff">
            <div className="rc-diff-row">
              <span className="rc-k">default</span>
              <span>
                <span className="rc-from">{expectedDefault ?? 'unset'}</span>
                <span className="rc-arrow">→</span>
                <span className="rc-to">{target.semVer}</span>
              </span>
            </div>
            {isConflict ? (
              <div className="rc-diff-row">
                <span className="rc-k">now</span>
                <span>
                  <span className="rc-now">{conflictDefault ?? 'unset'}</span>{' '}
                  <span className="rc-dim">written after this page loaded</span>
                </span>
              </div>
            ) : null}
            <div className="rc-diff-row">
              <span className="rc-k">{direction === 'forward' ? 'passes' : 'skips'}</span>
              <span className="rc-dim">{describeBetween(request)}</span>
            </div>
            <div className="rc-diff-row">
              <span className="rc-k">route</span>
              {routeChanged && live ? (
                <span>
                  <span className="rc-from">{routeLabel(live)}</span>
                  <span className="rc-arrow">→</span>
                  <span className="rc-warnv">{routeLabel(target)}</span>{' '}
                  <span className="rc-dim">startup changes</span>
                </span>
              ) : (
                <span>
                  {routeLabel(target)}{' '}
                  <span className="rc-dim">{live ? 'unchanged' : 'live route unknown'}</span>
                </span>
              )}
            </div>
            <div className="rc-diff-row">
              <span className="rc-k">writes</span>
              <span className="rc-dim">RuleSet.default only</span>
            </div>
            <div className="rc-diff-row">
              <span className="rc-k">live in</span>
              {/* Each edge container caches the rule set for 60s, so a router that read the
                  old default keeps serving it until its own entry expires. */}
              <span className="rc-dim">up to 60s · edge rule cache</span>
            </div>
          </div>

          {isConflict ? null : (
            <>
              <div className="rc-preview">
                <span>
                  Check it first: <code>{previewUrl}</code>
                </span>
                <a className="rc-btn" href={previewUrl} target="_blank" rel="noreferrer">
                  Preview ↗
                </a>
              </div>

              {needsAck ? (
                <>
                  <div className="rc-note warn">
                    {prereleaseKind(target.semVer)}s are for review. Once this is the default, every
                    visitor to <code>{path}</code> gets it.
                  </div>
                  <label className="rc-check" htmlFor={ackId}>
                    <input
                      id={ackId}
                      type="checkbox"
                      checked={acknowledged}
                      onChange={(event) => setAcknowledged(event.target.checked)}
                    />
                    <span className="rc-box" aria-hidden>
                      ✓
                    </span>
                    <span>
                      I previewed <code>{target.semVer}</code> and want it live for everyone
                    </span>
                  </label>
                </>
              ) : null}

              {appName === SELF_APP_NAME && expectedDefault ? (
                <div className="rc-note">
                  This is the console you are using. If <code>{target.semVer}</code> won&apos;t
                  load, open <code>/release?appver={expectedDefault}</code> and switch back.
                </div>
              ) : null}

              {error ? (
                <div className="rc-note danger" role="alert">
                  {error}
                </div>
              ) : null}
            </>
          )}

          <div className="rc-dlg-foot">
            <span className="rc-guard">
              {isConflict
                ? '409 · conditional write refused'
                : expectedDefault === null
                ? 'writes only if there is still no default'
                : `writes only if default is still ${expectedDefault}`}
            </span>
            <div className="rc-btns">
              {isConflict ? (
                <button type="button" className="rc-btn primary lg" onClick={onClose}>
                  Reload and review
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className="rc-btn ghost lg"
                    onClick={onClose}
                    disabled={isPending}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="rc-btn strong lg"
                    onClick={confirm}
                    aria-disabled={blocked}
                  >
                    {isPending ? verbs.pending : verbs.confirm}
                  </button>
                </>
              )}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
