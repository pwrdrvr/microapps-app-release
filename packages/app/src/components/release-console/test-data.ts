import { normalizeVersions } from '@/lib/release-console/normalize-records';
import type {
  ReleaseRouteType,
  ReleaseStartupType,
  ReleaseVersionStatus,
} from '@/lib/release-console/types';

type Row = [
  semVer: string,
  options?: {
    status?: ReleaseVersionStatus;
    type?: ReleaseRouteType;
    startup?: ReleaseStartupType;
  },
];

/** Versions shaped like the real `release` app, normalized the way the page does it. */
export function releaseVersions(
  defaultSemVer: string | null = '0.5.2',
  rows: Row[] = [
    ['0.5.3'],
    ['0.5.2'],
    ['0.4.7'],
    ['0.4.5'],
    ['0.4.3', { status: 'integrated' }],
    ['0.2.4', { startup: 'iframe' }],
    ['0.0.0-pr.106'],
    ['0.0.0-pr.68'],
  ],
) {
  return normalizeVersions('release', {
    Versions: rows.map(([SemVer, options = {}]) => ({
      AppName: 'release',
      SemVer,
      Type: options.type ?? 'lambda-url',
      StartupType: options.startup ?? 'direct',
      Status: options.status ?? 'routed',
      URL: `https://fn-${SemVer}.lambda-url.us-east-2.on.aws/`,
      LambdaARN: SemVer.includes('-pr.68')
        ? undefined
        : `arn:aws:lambda:us-east-2:123456789012:function:release:v${SemVer.replaceAll('.', '_')}`,
    })),
    Rules:
      defaultSemVer === null
        ? null
        : { AppName: 'release', RuleSet: { default: { SemVer: defaultSemVer } } },
  });
}

export function versionFor(semVer: string, defaultSemVer: string | null = '0.5.2') {
  const version = releaseVersions(defaultSemVer).find((candidate) => candidate.semVer === semVer);
  if (!version) {
    throw new Error(`No fixture version ${semVer}`);
  }

  return version;
}
