import type { ReleaseConsoleData } from '@/lib/release-console/types';
import { AppListClient } from './AppListClient';
import { AppMetadataPanel } from './AppMetadataPanel';
import { RulePanel } from './RulePanel';
import { VersionTable } from './VersionTable';

export function ReleaseConsoleShell({ data }: { data: ReleaseConsoleData }) {
  const defaultVersionRecord =
    data.versions.find((version) => version.semVer === data.defaultVersion) ?? null;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1600px] flex-col gap-6 px-4 py-6 md:px-6 lg:px-8">
      <section className="panel-surface overflow-hidden px-5 py-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="panel-label">MicroApps Release</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-foreground">
              Terminal-grade control for default versions
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-muted">
              Browse application inventory, inspect routing state, and change the default version
              only after an explicit confirmation step.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-border/80 bg-panelAlt/70 px-4 py-3">
              <p className="panel-label">Selected App</p>
              <p className="metric-value mt-2">{data.selectedAppDisplayName ?? 'n/a'}</p>
            </div>
            <div className="rounded-2xl border border-border/80 bg-panelAlt/70 px-4 py-3">
              <p className="panel-label">Default Version</p>
              <p className="metric-value mt-2">{data.defaultVersion ?? 'unset'}</p>
            </div>
            <div className="rounded-2xl border border-border/80 bg-panelAlt/70 px-4 py-3">
              <p className="panel-label">Tracked Versions</p>
              <p className="metric-value mt-2">{data.versions.length}</p>
            </div>
          </div>
        </div>

        {data.loadError ? (
          <div className="mt-6 rounded-2xl border border-warning/50 bg-warning/10 px-4 py-3 text-sm text-warning">
            {data.loadError}
          </div>
        ) : null}
      </section>

      <section className="grid flex-1 gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <div className="min-h-[32rem] xl:sticky xl:top-6 xl:self-start">
          <AppListClient apps={data.apps} selectedAppName={data.selectedAppName} />
        </div>

        <div className="grid gap-6">
          {data.selectedAppName ? (
            <VersionTable
              appName={data.selectedAppName}
              versions={data.versions}
              currentDefaultVersion={data.defaultVersion}
            />
          ) : (
            <div className="panel-surface px-5 py-10 text-sm text-muted">
              No application records were found in DynamoDB.
            </div>
          )}

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <RulePanel rules={data.rules} />
            <AppMetadataPanel versions={data.versions} defaultVersion={defaultVersionRecord} />
          </div>
        </div>
      </section>
    </main>
  );
}
