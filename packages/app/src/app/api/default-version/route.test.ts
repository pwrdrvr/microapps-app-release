import { beforeEach, describe, expect, test, vi } from 'vitest';
import { POST } from './route';
import {
  DefaultVersionError,
  updateDefaultVersion,
} from '@/lib/release-console/update-default-version';

const info = vi.fn();
const warn = vi.fn();
const error = vi.fn();

vi.mock('@/lib/release-console/update-default-version', async (importOriginal) => {
  const actual = await importOriginal<
    typeof import('@/lib/release-console/update-default-version')
  >();
  return { ...actual, updateDefaultVersion: vi.fn() };
});

vi.mock('@/utils/logger', () => ({
  createLogger: () => ({
    info,
    warn,
    error,
  }),
}));

function post(body: unknown) {
  return POST(
    new Request('http://localhost:3000/release/0.0.0/api/default-version', {
      method: 'POST',
      body: typeof body === 'string' ? body : JSON.stringify(body),
      headers: { 'content-type': 'application/json' },
    }),
  );
}

describe('POST /api/default-version', () => {
  beforeEach(() => {
    vi.mocked(updateDefaultVersion).mockReset();
    info.mockReset();
    warn.mockReset();
    error.mockReset();
  });

  test('returns 400 when the body is not JSON', async () => {
    const response = await post('not json');

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Request body must be JSON.' });
    expect(updateDefaultVersion).not.toHaveBeenCalled();
  });

  test('returns 400 when required fields are missing', async () => {
    const response = await post({ appName: 'release' });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: 'appName and semVer are required.',
    });
    expect(updateDefaultVersion).not.toHaveBeenCalled();
  });

  test('returns 400 when expectedDefault is missing', async () => {
    const response = await post({ appName: 'release', semVer: '0.5.3' });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: 'expectedDefault is required (use null when the app has no default).',
    });
    expect(updateDefaultVersion).not.toHaveBeenCalled();
  });

  test('returns the previous default after a conditional update', async () => {
    vi.mocked(updateDefaultVersion).mockResolvedValue({ previousDefault: '0.5.2', changed: true });

    const response = await post({
      appName: ' release ',
      semVer: ' 0.5.3 ',
      expectedDefault: ' 0.5.2 ',
    });

    expect(response.status).toBe(200);
    expect(updateDefaultVersion).toHaveBeenCalledWith({
      appName: 'release',
      semVer: '0.5.3',
      expectedDefault: '0.5.2',
    });
    await expect(response.json()).resolves.toEqual({
      ok: true,
      appName: 'release',
      semVer: '0.5.3',
      previousDefault: '0.5.2',
      changed: true,
    });
  });

  test('passes a null expectedDefault through for apps without a default', async () => {
    vi.mocked(updateDefaultVersion).mockResolvedValue({ previousDefault: null, changed: true });

    const response = await post({ appName: 'release', semVer: '0.5.3', expectedDefault: null });

    expect(response.status).toBe(200);
    expect(updateDefaultVersion).toHaveBeenCalledWith({
      appName: 'release',
      semVer: '0.5.3',
      expectedDefault: null,
    });
  });

  test('returns 409 with the actual default when the page was stale', async () => {
    vi.mocked(updateDefaultVersion).mockRejectedValue(
      new DefaultVersionError('The release default changed.', 409, '0.5.4'),
    );

    const response = await post({ appName: 'release', semVer: '0.4.7', expectedDefault: '0.5.3' });

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: 'The release default changed.',
      actualDefault: '0.5.4',
    });
    expect(warn).toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
  });

  test.each([
    [404, 'release has no version 9.9.9.'],
    [422, 'release 0.6.0 is integrated and cannot serve traffic yet.'],
  ] as const)('returns %i for refused versions', async (status, message) => {
    vi.mocked(updateDefaultVersion).mockRejectedValue(new DefaultVersionError(message, status));

    const response = await post({ appName: 'release', semVer: '9.9.9', expectedDefault: '0.5.3' });

    expect(response.status).toBe(status);
    await expect(response.json()).resolves.toEqual({ error: message });
  });

  test('returns 500 with the underlying error message when the write fails', async () => {
    vi.mocked(updateDefaultVersion).mockRejectedValue(new Error('DynamoDB unavailable'));

    const response = await post({ appName: 'release', semVer: '0.5.3', expectedDefault: '0.5.2' });

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: 'DynamoDB unavailable',
    });
    expect(error).toHaveBeenCalled();
  });
});
