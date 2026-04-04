import { NextResponse } from 'next/server';
import { updateDefaultVersion } from '@/lib/release-console/update-default-version';
import { createLogger } from '@/utils/logger';

export async function POST(request: Request) {
  const log = createLogger('api:default-version', request.url);

  try {
    const payload = (await request.json()) as { appName?: string; semVer?: string };
    const appName = payload.appName?.trim();
    const semVer = payload.semVer?.trim();

    if (!appName || !semVer) {
      return NextResponse.json({ error: 'appName and semVer are required.' }, { status: 400 });
    }

    await updateDefaultVersion(appName, semVer);
    log.info('updated default version', { appName, semVer });

    return NextResponse.json({ ok: true, appName, semVer });
  } catch (error) {
    log.error(error instanceof Error ? error : new Error(String(error)));

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unable to update the default version.',
      },
      { status: 500 },
    );
  }
}
