import type { ReleaseConsoleVersion } from '@/lib/release-console/types';
import { buildLambdaConsoleUrl, buildVersionPreviewUrl } from '@/lib/release-console/links';

function truncateMiddle(value: string) {
  if (value.length <= 36) {
    return value;
  }

  return `${value.slice(0, 18)}...${value.slice(-12)}`;
}

export function AppMetadataPanel({
  appName,
  versions,
  defaultVersion,
}: {
  appName: string | null;
  versions: ReleaseConsoleVersion[];
  defaultVersion: ReleaseConsoleVersion | null;
}) {
  const routeTypes = new Set(versions.map((version) => version.type));
  const startupTypes = new Set(versions.map((version) => version.startupType));
  const previewUrl =
    appName && defaultVersion ? buildVersionPreviewUrl(appName, defaultVersion.semVer) : null;
  const lambdaConsoleUrl = defaultVersion?.lambdaArn
    ? buildLambdaConsoleUrl(defaultVersion.lambdaArn)
    : null;

  return (
    <div className="panel-surface h-full p-5">
      <div>
        <p className="panel-label">Metadata</p>
        <h2 className="mt-2 text-lg font-semibold text-foreground">Operator context</h2>
      </div>

      <div className="mt-5 grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-border/80 bg-panelAlt/65 p-4">
            <p className="panel-label">Route Types</p>
            <p className="metric-value mt-2">{Array.from(routeTypes).join(', ') || 'n/a'}</p>
          </div>
          <div className="rounded-2xl border border-border/80 bg-panelAlt/65 p-4">
            <p className="panel-label">Startup Modes</p>
            <p className="metric-value mt-2">{Array.from(startupTypes).join(', ') || 'n/a'}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-border/80 bg-panelAlt/65 p-4">
          <p className="panel-label">Current Default URL</p>
          {defaultVersion?.url ? (
            <a
              href={defaultVersion.url}
              className="mt-2 block break-all font-mono text-sm text-accent hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              {defaultVersion.url}
            </a>
          ) : (
            <p className="mt-2 break-all font-mono text-sm text-foreground">n/a</p>
          )}

          {previewUrl ? (
            <div className="mt-3">
              <a
                href={previewUrl}
                className="inline-flex items-center rounded-full border border-accent/35 bg-accent/10 px-2.5 py-1 font-mono text-[0.68rem] uppercase tracking-[0.22em] text-accent hover:bg-accent/16"
                target="_blank"
                rel="noreferrer"
              >
                Preview Default
              </a>
            </div>
          ) : null}
        </div>

        <div className="rounded-2xl border border-border/80 bg-panelAlt/65 p-4">
          <p className="panel-label">Lambda ARN</p>
          {defaultVersion?.lambdaArn ? (
            <>
              <p className="mt-2 font-mono text-sm text-foreground">
                {truncateMiddle(defaultVersion.lambdaArn)}
              </p>

              {lambdaConsoleUrl ? (
                <div className="mt-3">
                  <a
                    href={lambdaConsoleUrl}
                    className="inline-flex items-center rounded-full border border-border bg-panelAlt/80 px-2.5 py-1 font-mono text-[0.68rem] uppercase tracking-[0.22em] text-muted hover:border-accent/40 hover:text-foreground"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open In AWS Console
                  </a>
                </div>
              ) : null}
            </>
          ) : (
            <p className="mt-2 font-mono text-sm text-foreground">n/a</p>
          )}
        </div>
      </div>
    </div>
  );
}
