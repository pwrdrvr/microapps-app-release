import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { buildReleaseConsoleData } from '@/lib/release-console/normalize-records';
import { ReleaseConsoleShell } from './ReleaseConsoleShell';

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(''),
}));

function data(overrides: Partial<Parameters<typeof buildReleaseConsoleData>[0]> = {}) {
  return buildReleaseConsoleData({
    applications: [
      { AppName: 'release', DisplayName: 'release' },
      { AppName: 'blog', DisplayName: 'blog' },
    ],
    versionsAndRules: {
      Versions: [
        {
          AppName: 'release',
          SemVer: '0.5.2',
          Type: 'lambda-url',
          StartupType: 'direct',
          Status: 'routed',
        },
      ],
      Rules: { AppName: 'release', RuleSet: { default: { SemVer: '0.5.2' } } },
    },
    source: {
      tableName: 'microapps-core-ghpublic-prod',
      region: 'us-east-2',
      loadedAt: '2026-09-19T19:31:06.000Z',
    },
    ...overrides,
  });
}

describe('ReleaseConsoleShell', () => {
  afterEach(() => {
    cleanup();
  });

  test('renders the rail, the selected app, and where the data came from', () => {
    render(<ReleaseConsoleShell data={data()} />);

    expect(screen.getByRole('navigation', { name: 'Apps' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'release' })).toBeTruthy();
    expect(screen.getByRole('table', { name: 'release versions' })).toBeTruthy();
    expect(screen.getByText('microapps-core-ghpublic-prod')).toBeTruthy();
    expect(screen.getByText('us-east-2')).toBeTruthy();
  });

  test('surfaces load errors without hiding the app list', () => {
    render(
      <ReleaseConsoleShell
        data={data({ versionsAndRules: null, loadError: 'Unable to load release: denied' })}
      />,
    );

    expect(screen.getByRole('alert').textContent).toBe('Unable to load release: denied');
    expect(screen.getAllByRole('button', { name: /blog/ }).length).toBeGreaterThan(0);
  });

  test('explains an empty table', () => {
    render(<ReleaseConsoleShell data={data({ applications: [], versionsAndRules: null })} />);

    expect(screen.getByText('No application records were found in DynamoDB.')).toBeTruthy();
  });
});
