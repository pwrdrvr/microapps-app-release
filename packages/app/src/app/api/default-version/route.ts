import { NextResponse } from 'next/server';
import {
  DefaultVersionError,
  updateDefaultVersion,
} from '@/lib/release-console/update-default-version';
import { createLogger } from '@/utils/logger';

function badRequest(error: string) {
  return NextResponse.json({ error }, { status: 400 });
}

export async function POST(request: Request) {
  const log = createLogger('api:default-version', request.url);

  let payload: { appName?: unknown; semVer?: unknown; expectedDefault?: unknown };
  try {
    payload = (await request.json()) as typeof payload;
  } catch {
    return badRequest('Request body must be JSON.');
  }

  const appName = typeof payload?.appName === 'string' ? payload.appName.trim() : '';
  const semVer = typeof payload?.semVer === 'string' ? payload.semVer.trim() : '';

  if (!appName || !semVer) {
    return badRequest('appName and semVer are required.');
  }

  if (
    !payload ||
    !('expectedDefault' in payload) ||
    (payload.expectedDefault !== null && typeof payload.expectedDefault !== 'string')
  ) {
    return badRequest('expectedDefault is required (use null when the app has no default).');
  }

  const expectedDefault =
    typeof payload.expectedDefault === 'string' ? payload.expectedDefault.trim() : null;

  try {
    const result = await updateDefaultVersion({ appName, semVer, expectedDefault });
    log.info('updated default version', { appName, semVer, ...result });

    return NextResponse.json({ ok: true, appName, semVer, ...result });
  } catch (error) {
    if (error instanceof DefaultVersionError) {
      log.warn('default version change refused', {
        appName,
        semVer,
        expectedDefault,
        status: error.status,
        reason: error.message,
      });

      return NextResponse.json(
        {
          error: error.message,
          ...(error.status === 409 ? { actualDefault: error.actualDefault ?? null } : {}),
        },
        { status: error.status },
      );
    }

    log.error(error instanceof Error ? error : new Error(String(error)));

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unable to update the default version.',
      },
      { status: 500 },
    );
  }
}
