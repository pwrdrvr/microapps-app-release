import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { AppRail } from './AppRail';

const push = vi.fn();

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ push }),
  useSearchParams: () => new URLSearchParams('keep=1'),
}));

const apps = [
  { appName: 'blog', displayName: 'blog', liveVersion: '0.0.0', newerRelease: null },
  {
    appName: 'nextjs-demo',
    displayName: 'nextjs-demo',
    liveVersion: '0.6.3',
    newerRelease: '0.7.0',
  },
  { appName: 'release', displayName: 'release', liveVersion: '0.5.3', newerRelease: null },
];

describe('AppRail', () => {
  beforeEach(() => {
    push.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  test('shows each app live version and flags newer releases', () => {
    render(<AppRail apps={apps} selectedAppName="release" focusShortcut />);

    const selected = screen.getByRole('button', { name: /release/ });
    expect(selected.getAttribute('aria-current')).toBe('page');
    expect(selected.textContent).toContain('0.5.3');
    expect(screen.getByRole('button', { name: /nextjs-demo/ }).textContent).toContain('↑ 0.7.0');
    expect(screen.getByRole('button', { name: /blog/ }).textContent).not.toContain('↑');
  });

  test('filters apps and opens the highlighted one with the keyboard', () => {
    render(<AppRail apps={apps} selectedAppName="release" focusShortcut />);

    const filter = screen.getByRole('textbox', { name: 'Filter apps' });
    fireEvent.change(filter, { target: { value: 'e' } });
    expect(screen.queryByRole('button', { name: /blog/ })).toBeNull();

    fireEvent.keyDown(filter, { key: 'Enter' });

    expect(push).toHaveBeenCalledWith('/?keep=1&app=nextjs-demo', { scroll: false });
  });

  test('says so when nothing matches', () => {
    render(<AppRail apps={apps} selectedAppName="release" />);

    fireEvent.change(screen.getByRole('textbox', { name: 'Filter apps' }), {
      target: { value: 'zzz' },
    });

    expect(screen.getByText('No apps match “zzz”.')).toBeTruthy();
  });

  test('focuses the filter on / unless the operator is typing', () => {
    render(<AppRail apps={apps} selectedAppName="release" focusShortcut />);
    const filter = screen.getByRole('textbox', { name: 'Filter apps' });

    fireEvent.keyDown(document.body, { key: '/' });

    expect(document.activeElement).toBe(filter);
  });

  test('does not navigate when the selected app is picked again', () => {
    const onSelected = vi.fn();
    render(<AppRail apps={apps} selectedAppName="release" onSelected={onSelected} />);

    fireEvent.click(screen.getByRole('button', { name: /release/ }));

    expect(onSelected).toHaveBeenCalledWith('release');
    expect(push).not.toHaveBeenCalled();
  });
});
