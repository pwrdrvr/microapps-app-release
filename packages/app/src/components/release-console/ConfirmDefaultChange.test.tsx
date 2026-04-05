import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { ConfirmDefaultChange } from './ConfirmDefaultChange';

const refresh = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh }),
}));

describe('ConfirmDefaultChange', () => {
  beforeEach(() => {
    refresh.mockReset();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
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
      expect(fetchMock).toHaveBeenCalledWith('/release/0.0.0/api/default-version', {
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

    expect(screen.getByRole('button', { name: 'Confirm Default' })).toHaveProperty('disabled', true);
  });
});
