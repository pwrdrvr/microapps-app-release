import { beforeEach, describe, expect, test, vi } from 'vitest';
import { POST } from './route';
import { updateDefaultVersion } from '@/lib/release-console/update-default-version';

const info = vi.fn();
const error = vi.fn();

vi.mock('@/lib/release-console/update-default-version', () => ({
  updateDefaultVersion: vi.fn(),
}));

vi.mock('@/utils/logger', () => ({
  createLogger: () => ({
    info,
    error,
  }),
}));

describe('POST /api/default-version', () => {
  beforeEach(() => {
    vi.mocked(updateDefaultVersion).mockReset();
    info.mockReset();
    error.mockReset();
  });

  test('returns 400 when required fields are missing', async () => {
    const response = await POST(
      new Request('http://localhost:3000/release/0.0.0/api/default-version', {
        method: 'POST',
        body: JSON.stringify({ appName: 'release' }),
        headers: { 'content-type': 'application/json' },
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: 'appName and semVer are required.',
    });
    expect(updateDefaultVersion).not.toHaveBeenCalled();
  });

  test('returns success payload after updating the default version', async () => {
    vi.mocked(updateDefaultVersion).mockResolvedValue(undefined);

    const response = await POST(
      new Request('http://localhost:3000/release/0.0.0/api/default-version', {
        method: 'POST',
        body: JSON.stringify({ appName: ' release ', semVer: ' 0.5.3 ' }),
        headers: { 'content-type': 'application/json' },
      }),
    );

    expect(response.status).toBe(200);
    expect(updateDefaultVersion).toHaveBeenCalledWith('release', '0.5.3');
    await expect(response.json()).resolves.toEqual({
      ok: true,
      appName: 'release',
      semVer: '0.5.3',
    });
  });

  test('returns 500 with the underlying error message when the write fails', async () => {
    vi.mocked(updateDefaultVersion).mockRejectedValue(new Error('DynamoDB unavailable'));

    const response = await POST(
      new Request('http://localhost:3000/release/0.0.0/api/default-version', {
        method: 'POST',
        body: JSON.stringify({ appName: 'release', semVer: '0.5.3' }),
        headers: { 'content-type': 'application/json' },
      }),
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: 'DynamoDB unavailable',
    });
    expect(error).toHaveBeenCalled();
  });
});
