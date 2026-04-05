'use client';

import { useState } from 'react';
import type { ReleaseConsoleVersion } from '@/lib/release-console/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { buildLambdaConsoleUrl, buildVersionPreviewUrl } from '@/lib/release-console/links';
import { ConfirmDefaultChange } from './ConfirmDefaultChange';

function statusVariant(status: ReleaseConsoleVersion['status']) {
  if (status === 'deployed' || status === 'routed') {
    return 'success' as const;
  }

  if (status === 'integrated' || status === 'permissioned') {
    return 'warning' as const;
  }

  return 'muted' as const;
}

export function VersionTable({
  appName,
  versions,
  currentDefaultVersion,
}: {
  appName: string;
  versions: ReleaseConsoleVersion[];
  currentDefaultVersion: string | null;
}) {
  const [nextVersion, setNextVersion] = useState<ReleaseConsoleVersion | null>(null);

  return (
    <>
      <div className="panel-surface overflow-hidden">
        <div className="flex items-center justify-between gap-4 border-b border-border/80 px-5 py-4">
          <div>
            <p className="panel-label">Versions</p>
            <h2 className="mt-2 text-lg font-semibold text-foreground">Release inventory</h2>
          </div>
          <div className="data-chip">{versions.length} versions</div>
        </div>

        <div className="max-h-[min(68vh,44rem)] overflow-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="border-b border-border/70 text-left">
                {['Version', 'Status', 'Route', 'Startup', 'URL', 'Default'].map((heading) => (
                  <th
                    key={heading}
                    className="sticky top-0 z-10 bg-panel/95 px-5 py-3 font-mono text-[0.68rem] uppercase tracking-[0.24em] text-muted backdrop-blur"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {versions.map((version) => {
                const previewUrl = buildVersionPreviewUrl(appName, version.semVer);
                const lambdaConsoleUrl = buildLambdaConsoleUrl(version.lambdaArn);

                return (
                  <tr key={version.semVer} className="border-b border-border/40 last:border-b-0">
                    <td className="px-5 py-4 align-top">
                      <div className="font-mono text-sm text-foreground">{version.semVer}</div>
                      {version.defaultFile ? (
                        <div className="mt-1 font-mono text-[0.72rem] uppercase tracking-[0.18em] text-muted">
                          default file {version.defaultFile}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-5 py-4 align-top">
                      <Badge variant={statusVariant(version.status)}>{version.status}</Badge>
                    </td>
                    <td className="px-5 py-4 align-top">
                      <span className="font-mono text-sm text-foreground">{version.type}</span>
                    </td>
                    <td className="px-5 py-4 align-top">
                      <span className="font-mono text-sm text-foreground">
                        {version.startupType}
                      </span>
                    </td>
                    <td className="px-5 py-4 align-top">
                      {version.url ? (
                        <a
                          href={version.url}
                          className="break-all font-mono text-xs text-accent hover:underline"
                          target="_blank"
                          rel="noreferrer"
                        >
                          {version.url}
                        </a>
                      ) : (
                        <span className="font-mono text-sm text-muted">n/a</span>
                      )}

                      <div className="mt-3 flex flex-wrap gap-2">
                        <a
                          href={previewUrl}
                          className="inline-flex items-center rounded-full border border-accent/35 bg-accent/10 px-2.5 py-1 font-mono text-[0.68rem] uppercase tracking-[0.22em] text-accent hover:bg-accent/16"
                          target="_blank"
                          rel="noreferrer"
                        >
                          Preview
                        </a>

                        {lambdaConsoleUrl ? (
                          <a
                            href={lambdaConsoleUrl}
                            className="inline-flex items-center rounded-full border border-border bg-panelAlt/80 px-2.5 py-1 font-mono text-[0.68rem] uppercase tracking-[0.22em] text-muted hover:border-accent/40 hover:text-foreground"
                            target="_blank"
                            rel="noreferrer"
                          >
                            Lambda Console
                          </a>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-5 py-4 align-top">
                      {version.isDefault ? (
                        <Badge variant="accent">Current</Badge>
                      ) : (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setNextVersion(version)}
                        >
                          Make Default
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDefaultChange
        open={nextVersion !== null}
        onOpenChange={(open) => {
          if (!open) {
            setNextVersion(null);
          }
        }}
        appName={appName}
        currentDefaultVersion={currentDefaultVersion}
        nextVersion={nextVersion}
      />
    </>
  );
}
