import type { ReleaseConsoleData } from '@/lib/release-console/types';
import { AppPicker } from './AppPicker';
import { AppRail } from './AppRail';
import { AppReleasePanel } from './AppReleasePanel';
import { ConsoleFooter, ConsoleVersionChip } from './ConsoleChrome';

export function ReleaseConsoleShell({ data }: { data: ReleaseConsoleData }) {
  return (
    <div className="rc rc-app">
      <header className="rc-top">
        <div className="rc-brand">
          <span className="rc-mark" aria-hidden />
          <span className="rc-title">MicroApps Release</span>
        </div>
        <ConsoleVersionChip />
      </header>

      <div className="rc-body">
        <aside className="rc-side">
          <AppRail apps={data.apps} selectedAppName={data.selectedAppName} focusShortcut />
        </aside>

        <main className="rc-main">
          <AppPicker
            apps={data.apps}
            selectedAppName={data.selectedAppName}
            selectedAppDisplayName={data.selectedAppDisplayName}
          />

          {data.loadError ? (
            <div className="rc-note danger rc-alert" role="alert">
              {data.loadError}
            </div>
          ) : null}

          {data.selectedAppName ? (
            <AppReleasePanel
              // A fresh panel per app, so an open dialog or banner never carries across apps.
              key={data.selectedAppName}
              appName={data.selectedAppName}
              displayName={data.selectedAppDisplayName ?? data.selectedAppName}
              versions={data.versions}
              rules={data.rules}
              defaultVersion={data.defaultVersion}
            />
          ) : data.loadError ? null : (
            <div className="rc-note rc-alert">No application records were found in DynamoDB.</div>
          )}
        </main>
      </div>

      <ConsoleFooter source={data.source} healthy={data.loadError === null} />
    </div>
  );
}
