import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { ConfirmDefaultChange } from './ConfirmDefaultChange';
import { versionFor } from './test-data';

const refresh = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh }),
}));

function respond(status: number, body: unknown) {
  vi.mocked(fetch).mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response);
}

function renderDialog(semVer: string, { appName = 'release', expectedDefault = '0.5.2' } = {}) {
  const onClose = vi.fn();
  const onApplied = vi.fn();

  render(
    <ConfirmDefaultChange
      appName={appName}
      request={{ target: versionFor(semVer, expectedDefault), expectedDefault }}
      live={versionFor(expectedDefault, expectedDefault)}
      onClose={onClose}
      onApplied={onApplied}
    />,
  );

  return { onClose, onApplied };
}

function confirmButton() {
  return screen.getByRole('button', { name: /^(Promote|Roll back|Make)/ });
}

describe('ConfirmDefaultChange', () => {
  beforeEach(() => {
    refresh.mockReset();
    vi.stubGlobal('fetch', vi.fn());
    document.head.innerHTML =
      '<script src="/release/0.0.0-pr.106/_next/static/chunks/page.js"></script>';
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    document.head.innerHTML = '';
  });

  test('describes a rollback and what it skips', () => {
    renderDialog('0.4.5');

    expect(screen.getByRole('heading', { name: 'Roll back release to 0.4.5?' })).toBeTruthy();
    expect(screen.getByText('skips')).toBeTruthy();
    expect(screen.getByText('0.4.7')).toBeTruthy();
    expect(screen.getByText('writes only if default is still 0.5.2')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Preview ↗' }).getAttribute('href')).toBe(
      '/release?appver=0.4.5',
    );
  });

  test('describes a promotion to the next release', () => {
    renderDialog('0.5.3');

    expect(screen.getByRole('heading', { name: 'Promote release to 0.5.3?' })).toBeTruthy();
    expect(screen.getByText('passes')).toBeTruthy();
    expect(screen.getByText('nothing — adjacent release')).toBeTruthy();
    expect(confirmButton().textContent).toBe('Promote 0.5.3');
  });

  test('warns that the edge rule cache delays the change', () => {
    renderDialog('0.5.3');

    // Routers cache the rule set for 60s, so a change that has not landed yet is
    // expected rather than a failed write.
    expect(screen.getByText('live in')).toBeTruthy();
    expect(screen.getByText('up to 60s · edge rule cache')).toBeTruthy();
  });

  test('calls out a startup change against the live route', () => {
    renderDialog('0.2.4');

    expect(screen.getByText('lambda-url · iframe')).toBeTruthy();
    expect(screen.getByText('startup changes')).toBeTruthy();
  });

  test('posts a conditional change to the versioned API and reports it', async () => {
    respond(200, { ok: true, previousDefault: '0.5.2', changed: true });
    const { onApplied } = renderDialog('0.4.7');

    fireEvent.click(confirmButton());

    await waitFor(() => expect(onApplied).toHaveBeenCalled());
    expect(fetch).toHaveBeenCalledWith('/release/0.0.0-pr.106/api/default-version', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ appName: 'release', semVer: '0.4.7', expectedDefault: '0.5.2' }),
    });
    expect(onApplied).toHaveBeenCalledWith(expect.objectContaining({ from: '0.5.2', to: '0.4.7' }));
    expect(refresh).toHaveBeenCalled();
  });

  test('makes the operator acknowledge a PR build before it can go live', async () => {
    respond(200, { ok: true, previousDefault: '0.5.2', changed: true });
    const { onApplied } = renderDialog('0.0.0-pr.106');

    expect(
      screen.getByRole('heading', {
        name: 'Serve PR build 0.0.0-pr.106 as the release default?',
      }),
    ).toBeTruthy();
    expect(confirmButton().getAttribute('aria-disabled')).toBe('true');
    fireEvent.click(confirmButton());
    expect(fetch).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('checkbox', { name: /I previewed 0\.0\.0-pr\.106/ }));
    expect(confirmButton().getAttribute('aria-disabled')).toBe('false');
    fireEvent.click(confirmButton());

    await waitFor(() => expect(onApplied).toHaveBeenCalled());
  });

  test('warns that changing the release app changes this console', () => {
    renderDialog('0.4.7');
    expect(screen.getByText(/This is the console you are using/)).toBeTruthy();
    cleanup();

    renderDialog('0.4.7', { appName: 'blog' });
    expect(screen.queryByText(/This is the console you are using/)).toBeNull();
  });

  test('shows the stale default when the conditional write is refused', async () => {
    respond(409, { error: 'The release default changed.', actualDefault: '0.5.4' });
    const { onApplied, onClose } = renderDialog('0.4.7');

    fireEvent.click(confirmButton());

    expect(
      await screen.findByRole('heading', { name: 'The default moved. Nothing was written.' }),
    ).toBeTruthy();
    expect(screen.getByText('0.5.4')).toBeTruthy();
    expect(screen.getByText('409 · conditional write refused')).toBeTruthy();
    expect(refresh).toHaveBeenCalled();
    expect(onApplied).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Reload and review' }));
    expect(onClose).toHaveBeenCalled();
  });

  test('keeps the dialog open with the reason when the server refuses', async () => {
    respond(422, { error: 'release 0.4.7 is integrated and cannot serve traffic yet.' });
    const { onApplied } = renderDialog('0.4.7');

    fireEvent.click(confirmButton());

    expect((await screen.findByRole('alert')).textContent).toBe(
      'release 0.4.7 is integrated and cannot serve traffic yet.',
    );
    expect(onApplied).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
  });
});
