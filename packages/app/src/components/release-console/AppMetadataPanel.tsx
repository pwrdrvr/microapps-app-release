import type { ReleaseConsoleVersion } from '@/lib/release-console/types';

function truncateMiddle(value: string) {
  if (value.length <= 36) {
    return value;
  }

  return `${value.slice(0, 18)}...${value.slice(-12)}`;
}

export function AppMetadataPanel({
  versions,
  defaultVersion,
}: {
  versions: ReleaseConsoleVersion[];
  defaultVersion: ReleaseConsoleVersion | null;
}) {
  const routeTypes = new Set(versions.map((version) => version.type));
  const startupTypes = new Set(versions.map((version) => version.startupType));

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
          <p className="mt-2 break-all font-mono text-sm text-foreground">
            {defaultVersion?.url || 'n/a'}
          </p>
        </div>

        <div className="rounded-2xl border border-border/80 bg-panelAlt/65 p-4">
          <p className="panel-label">Lambda ARN</p>
          <p className="mt-2 font-mono text-sm text-foreground">
            {defaultVersion?.lambdaArn ? truncateMiddle(defaultVersion.lambdaArn) : 'n/a'}
          </p>
        </div>
      </div>
    </div>
  );
}
