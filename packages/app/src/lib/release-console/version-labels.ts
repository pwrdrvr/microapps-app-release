import type { ReleaseConsoleVersion, ReleaseVersionStatus } from './types';

/** Which way a default change moves the app, from the operator's point of view. */
export type ChangeDirection = 'forward' | 'back' | 'prerelease' | 'set';

export function changeDirection(version: ReleaseConsoleVersion): ChangeDirection {
  switch (version.relation) {
    case 'newer':
      return 'forward';
    case 'older':
      return 'back';
    case 'prerelease':
      return 'prerelease';
    default:
      return 'set';
  }
}

export function isPrBuild(semVer: string) {
  return /-pr\.\d+/i.test(semVer);
}

export function prereleaseKind(semVer: string) {
  return isPrBuild(semVer) ? 'PR build' : 'prerelease';
}

export function actionVerb(version: ReleaseConsoleVersion) {
  switch (changeDirection(version)) {
    case 'forward':
      return 'Promote';
    case 'back':
      return 'Roll back';
    default:
      return 'Make default';
  }
}

/** The "vs live" column: `+2 newer`, `−3 back`, `pr build`, ... */
export function relationLabel(version: ReleaseConsoleVersion) {
  switch (version.relation) {
    case 'live':
      return 'live';
    case 'newer':
      return `+${version.distance} newer`;
    case 'older':
      return `−${version.distance} back`;
    case 'prerelease':
      return prereleaseKind(version.semVer).toLowerCase();
    default:
      return '—';
  }
}

export function routeLabel(version: Pick<ReleaseConsoleVersion, 'type' | 'startupType'>) {
  return `${version.type} · ${version.startupType}`;
}

export function statusTone(status: ReleaseVersionStatus) {
  if (status === 'routed' || status === 'deployed') {
    return 'ok' as const;
  }

  return status === 'pending' ? ('down' as const) : ('waiting' as const);
}

export function appPath(appName: string) {
  return appName === '[root]' ? '/' : `/${appName}`;
}
