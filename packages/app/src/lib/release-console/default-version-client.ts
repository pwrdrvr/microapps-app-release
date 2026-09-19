import { buildDefaultVersionApiUrl } from './links';

export interface DefaultVersionRequest {
  appName: string;
  semVer: string;
  /** The default the operator saw; the write is refused if it has moved since. */
  expectedDefault: string | null;
}

export type DefaultVersionResponse =
  | { ok: true; previousDefault: string | null; changed: boolean }
  | { ok: false; status: number; error: string; actualDefault?: string | null };

export async function postDefaultVersion(
  request: DefaultVersionRequest,
): Promise<DefaultVersionResponse> {
  let response: Response;
  try {
    response = await fetch(buildDefaultVersionApiUrl(), {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(request),
    });
  } catch (error) {
    return {
      ok: false,
      status: 0,
      error: error instanceof Error ? error.message : 'The request did not reach the server.',
    };
  }

  const payload = (await response.json().catch(() => null)) as {
    error?: string;
    previousDefault?: string | null;
    changed?: boolean;
    actualDefault?: string | null;
  } | null;

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      error: payload?.error ?? 'Unable to update the default version.',
      ...(payload && 'actualDefault' in payload ? { actualDefault: payload.actualDefault } : {}),
    };
  }

  return {
    ok: true,
    previousDefault: payload?.previousDefault ?? request.expectedDefault,
    changed: payload?.changed ?? true,
  };
}
