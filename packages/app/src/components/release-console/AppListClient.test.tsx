import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { AppListClient } from './AppListClient';

vi.mock('lucide-react', () => ({
  Box: () => <span data-testid="box-icon" />,
  ChevronsRight: () => <span data-testid="chevrons-right-icon" />,
  ExternalLink: () => <span data-testid="external-link-icon" />,
  Search: () => <span data-testid="search-icon" />,
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/release',
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(''),
}));

describe('AppListClient', () => {
  test('renders the app count and names', () => {
    render(
      <AppListClient
        apps={[
          { appName: 'release', displayName: 'release' },
          { appName: 'blog', displayName: 'blog' },
        ]}
        selectedAppName="release"
      />,
    );

    expect(screen.getByText('2 apps')).toBeTruthy();
    expect(screen.getAllByText('release')).toHaveLength(2);
    expect(screen.getAllByText('blog')).toHaveLength(2);
  });

  test('renders an open-app link that leaves routing to MicroApps', () => {
    render(
      <AppListClient
        apps={[{ appName: 'release', displayName: 'release' }]}
        selectedAppName="release"
      />,
    );

    const links = screen.getAllByRole('link', { name: 'Open release' });
    expect(links.some((link) => link.getAttribute('href') === '/release')).toBe(true);
  });
});
