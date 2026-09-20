import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { ReleaseConsoleRule } from '@/lib/release-console/types';
import { AppReleasePanel } from './AppReleasePanel';
import { releaseVersions } from './test-data';

const refresh = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh }),
}));

const rules: ReleaseConsoleRule[] = [
  {
    key: 'default',
    attributeName: '',
    attributeValue: '',
    semVer: '0.5.2',
    isDefault: true,
    servesLiveVersion: true,
    isDangling: false,
  },
  {
    key: 'beta',
    attributeName: 'organization',
    attributeValue: 'beta-org',
    semVer: '0.4.7',
    isDefault: false,
    servesLiveVersion: false,
    isDangling: false,
  },
];

function panel(defaultVersion: string) {
  return (
    <AppReleasePanel
      appName="release"
      displayName="release"
      versions={releaseVersions(defaultVersion)}
      rules={rules}
      defaultVersion={defaultVersion}
    />
  );
}

function okResponse() {
  return { ok: true, status: 200, json: async () => ({ ok: true, changed: true }) } as Response;
}

describe('AppReleasePanel', () => {
  beforeEach(() => {
    refresh.mockReset();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  test('shows the live default and every rule in its own grid', () => {
    render(panel('0.5.2'));

    expect(screen.getByRole('heading', { name: 'release' })).toBeTruthy();
    const rulesGrid = screen.getByRole('table', { name: 'Routing rules' });
    expect(within(rulesGrid).getByRole('rowheader', { name: 'default' })).toBeTruthy();
    expect(within(rulesGrid).getByRole('rowheader', { name: 'beta' })).toBeTruthy();
    expect(within(rulesGrid).getByText('organization=beta-org')).toBeTruthy();
  });

  test('confirms a change, then offers a one-click revert', async () => {
    vi.mocked(fetch).mockResolvedValue(okResponse());
    const { rerender } = render(panel('0.5.2'));

    fireEvent.click(screen.getByRole('button', { name: 'Roll back 0.4.7' }));
    fireEvent.click(screen.getByRole('button', { name: 'Roll back to 0.4.7' }));
    await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));

    // The refresh brings the new default back from the server.
    rerender(panel('0.4.7'));

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('status').textContent).toContain(
      'release now serves 0.4.7 — was 0.5.2',
    );
    // An edge router still inside its 60s rule cache serves the old version; without
    // this the banner reads as a write that silently did nothing.
    expect(screen.getByRole('status').textContent).toContain('cache rules for up to 60s');

    fireEvent.click(screen.getByRole('button', { name: 'Revert to 0.5.2' }));
    await waitFor(() => expect(refresh).toHaveBeenCalledTimes(2));
    expect(JSON.parse(vi.mocked(fetch).mock.calls[1][1]?.body as string)).toEqual({
      appName: 'release',
      semVer: '0.5.2',
      expectedDefault: '0.4.7',
    });

    rerender(panel('0.5.2'));
    expect(screen.getByRole('status').textContent).toContain(
      'release now serves 0.5.2 — was 0.4.7',
    );
  });

  test('drops the banner once the default has moved somewhere else', async () => {
    vi.mocked(fetch).mockResolvedValue(okResponse());
    const { rerender } = render(panel('0.5.2'));

    fireEvent.click(screen.getByRole('button', { name: 'Roll back 0.4.7' }));
    fireEvent.click(screen.getByRole('button', { name: 'Roll back to 0.4.7' }));
    await waitFor(() => expect(refresh).toHaveBeenCalled());
    rerender(panel('0.4.7'));
    expect(screen.getByRole('status')).toBeTruthy();

    rerender(panel('0.5.3'));

    expect(screen.queryByRole('status')).toBeNull();
  });
});
