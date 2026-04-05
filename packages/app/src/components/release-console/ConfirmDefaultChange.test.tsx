import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { ConfirmDefaultChange } from './ConfirmDefaultChange';

const refresh = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh }),
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & { children?: React.ReactNode }) => (
    <button {...props}>{children}</button>
  ),
}));

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({
    children,
    open,
  }: {
    children?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
  }) => (open ? <div>{children}</div> : null),
  DialogContent: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  DialogDescription: ({ children }: { children?: React.ReactNode }) => <p>{children}</p>,
  DialogFooter: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children?: React.ReactNode }) => <h2>{children}</h2>,
}));

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

  test('posts to the versioned release API path and refreshes on success', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    } as Response);

    const onOpenChange = vi.fn();

    render(
      <ConfirmDefaultChange
        open
        onOpenChange={onOpenChange}
        appName="release"
        currentDefaultVersion="0.5.2"
        nextVersion={{
          appName: 'release',
          semVer: '0.5.3',
          type: 'lambda-url',
          startupType: 'direct',
          status: 'routed',
          defaultFile: '',
          integrationId: '',
          url: 'https://example.com',
          lambdaArn: 'arn:aws:lambda:us-east-2:123:function:release',
          isDefault: false,
        }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Confirm Default' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/release/0.0.0-pr.106/api/default-version', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({ appName: 'release', semVer: '0.5.3' }),
      });
    });

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false);
      expect(refresh).toHaveBeenCalled();
    });
  });

  test('surfaces a server error payload when the update fails', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Rules write failed.' }),
    } as Response);

    render(
      <ConfirmDefaultChange
        open
        onOpenChange={vi.fn()}
        appName="release"
        currentDefaultVersion="0.5.2"
        nextVersion={{
          appName: 'release',
          semVer: '0.5.3',
          type: 'lambda-url',
          startupType: 'direct',
          status: 'routed',
          defaultFile: '',
          integrationId: '',
          url: 'https://example.com',
          lambdaArn: 'arn:aws:lambda:us-east-2:123:function:release',
          isDefault: false,
        }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Confirm Default' }));

    expect(await screen.findByText('Rules write failed.')).toBeTruthy();
    expect(refresh).not.toHaveBeenCalled();
  });

  test('does not allow confirmation when no version is selected', () => {
    render(
      <ConfirmDefaultChange
        open
        onOpenChange={vi.fn()}
        appName="release"
        currentDefaultVersion="0.5.2"
        nextVersion={null}
      />,
    );

    expect(screen.getByRole('button', { name: 'Confirm Default' })).toHaveProperty(
      'disabled',
      true,
    );
  });
});
