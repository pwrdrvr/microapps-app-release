import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { ReleaseConsoleShell } from './ReleaseConsoleShell';

vi.mock('./AppListClient', () => ({
  AppListClient: () => <div>App list</div>,
}));

vi.mock('./VersionTable', () => ({
  VersionTable: () => <div>Release inventory</div>,
}));

vi.mock('./RulePanel', () => ({
  RulePanel: () => <div>Rules</div>,
}));

vi.mock('./AppMetadataPanel', () => ({
  AppMetadataPanel: () => <div>Metadata</div>,
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/release',
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(''),
}));

describe('ReleaseConsoleShell', () => {
  test('renders the selected app summary and default version', () => {
    render(
      <ReleaseConsoleShell
        data={{
          apps: [{ appName: 'release', displayName: 'release' }],
          selectedAppName: 'release',
          selectedAppDisplayName: 'release',
          versions: [
            {
              appName: 'release',
              semVer: '0.5.2',
              type: 'lambda-url',
              startupType: 'direct',
              status: 'routed',
              defaultFile: '',
              integrationId: '',
              url: 'https://example.com',
              lambdaArn: 'arn:aws:lambda:us-east-2:123456789012:function:release',
              isDefault: true,
            },
          ],
          rules: [
            {
              key: 'default',
              attributeName: '',
              attributeValue: '',
              semVer: '0.5.2',
              isDefault: true,
            },
          ],
          defaultVersion: '0.5.2',
          loadError: null,
        }}
      />,
    );

    expect(screen.getAllByText('release').length).toBeGreaterThan(0);
    expect(screen.getAllByText('0.5.2').length).toBeGreaterThan(0);
    expect(screen.getByText('Release inventory')).toBeTruthy();
  });
});
