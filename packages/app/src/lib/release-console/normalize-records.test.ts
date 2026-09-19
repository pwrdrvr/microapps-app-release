import { describe, expect, test } from 'vitest';
import {
  buildReleaseConsoleData,
  findNewerRelease,
  isPrereleaseVersion,
  normalizeApps,
  normalizeRules,
  normalizeVersions,
  selectAppName,
} from './normalize-records';
import type { ReleaseVersionStatus, VersionsAndRulesRecord } from './types';

function records(
  defaultSemVer: string | null,
  versions: (string | [string, ReleaseVersionStatus])[],
): VersionsAndRulesRecord {
  return {
    Versions: versions.map((entry) => {
      const [SemVer, Status] = typeof entry === 'string' ? [entry, 'routed' as const] : entry;
      return { AppName: 'release', SemVer, Type: 'lambda-url', StartupType: 'direct', Status };
    }),
    Rules:
      defaultSemVer === null
        ? null
        : { AppName: 'release', RuleSet: { default: { SemVer: defaultSemVer } } },
  };
}

describe('normalize-records', () => {
  test('falls back to app name when display name is blank and sorts case-insensitively', () => {
    expect(
      normalizeApps([
        { AppName: 'zeta', DisplayName: '' },
        { AppName: 'Alpha', DisplayName: 'Alpha' },
      ]),
    ).toEqual([
      { appName: 'Alpha', displayName: 'Alpha', liveVersion: null, newerRelease: null },
      { appName: 'zeta', displayName: 'zeta', liveVersion: null, newerRelease: null },
    ]);
  });

  test('carries each app live version and flags a newer promotable release', () => {
    expect(
      normalizeApps(
        [
          { AppName: 'release', DisplayName: 'release' },
          { AppName: 'blog', DisplayName: 'blog' },
        ],
        {
          release: {
            liveVersion: '0.5.2',
            versions: [
              { SemVer: '0.5.3', Status: 'routed' },
              { SemVer: '0.5.2', Status: 'routed' },
            ],
          },
          blog: { liveVersion: '1.0.0', versions: [{ SemVer: '1.0.0', Status: 'routed' }] },
        },
      ),
    ).toEqual([
      { appName: 'blog', displayName: 'blog', liveVersion: '1.0.0', newerRelease: null },
      { appName: 'release', displayName: 'release', liveVersion: '0.5.2', newerRelease: '0.5.3' },
    ]);
  });

  test('only counts routed releases above the live default as newer', () => {
    expect(
      findNewerRelease('0.5.2', [
        { SemVer: '0.6.0', Status: 'integrated' },
        { SemVer: '0.5.4', Status: 'deployed' },
        { SemVer: '0.5.3', Status: 'routed' },
        { SemVer: '0.0.0-pr.106', Status: 'routed' },
        { SemVer: '0.5.1', Status: 'routed' },
      ]),
    ).toBe('0.5.4');
    expect(findNewerRelease('0.5.4', [{ SemVer: '0.0.0-pr.106', Status: 'routed' }])).toBeNull();
    expect(findNewerRelease(null, [{ SemVer: '0.5.3', Status: 'routed' }])).toBeNull();
  });

  test('treats PR builds and other prerelease tags as prereleases', () => {
    expect(isPrereleaseVersion('0.0.0-pr.106')).toBe(true);
    expect(isPrereleaseVersion('0.0.0-dummy.1')).toBe(true);
    expect(isPrereleaseVersion('0.5.3')).toBe(false);
    expect(isPrereleaseVersion('not-semver')).toBe(true);
  });

  test('ranks releases against the live default and lists what a change skips', () => {
    const versions = normalizeVersions(
      'release',
      records('0.4.7', [
        '0.5.3',
        '0.5.2',
        '0.4.7',
        '0.4.5',
        ['0.4.3', 'integrated'],
        '0.0.0-pr.106',
      ]),
    );

    expect(
      versions.map(({ semVer, relation, distance, between, isPrerelease, promotable }) => ({
        semVer,
        relation,
        distance,
        between,
        isPrerelease,
        promotable,
      })),
    ).toEqual([
      {
        semVer: '0.5.3',
        relation: 'newer',
        distance: 2,
        between: ['0.5.2'],
        isPrerelease: false,
        promotable: true,
      },
      {
        semVer: '0.5.2',
        relation: 'newer',
        distance: 1,
        between: [],
        isPrerelease: false,
        promotable: true,
      },
      {
        semVer: '0.4.7',
        relation: 'live',
        distance: 0,
        between: [],
        isPrerelease: false,
        promotable: true,
      },
      {
        semVer: '0.4.5',
        relation: 'older',
        distance: 1,
        between: [],
        isPrerelease: false,
        promotable: true,
      },
      {
        semVer: '0.4.3',
        relation: 'older',
        distance: 2,
        between: ['0.4.5'],
        isPrerelease: false,
        promotable: false,
      },
      {
        semVer: '0.0.0-pr.106',
        relation: 'prerelease',
        distance: 0,
        between: [],
        isPrerelease: true,
        promotable: true,
      },
    ]);
  });

  test('leaves releases unranked when the app has no default', () => {
    expect(
      normalizeVersions('release', records(null, ['0.5.3', '0.0.0-pr.1'])).map(
        (version) => version.relation,
      ),
    ).toEqual(['unranked', 'prerelease']);
  });

  test('respects a requested app when it exists and falls back to release otherwise', () => {
    const apps = [
      { appName: 'blog', displayName: 'Blog', liveVersion: null, newerRelease: null },
      { appName: 'release', displayName: 'Release', liveVersion: null, newerRelease: null },
    ];

    expect(selectAppName(apps, 'blog')).toBe('blog');
    expect(selectAppName(apps, 'missing')).toBe('release');
  });

  test('sorts semver versions descending and falls back to lexical ordering for non-semver values', () => {
    expect(
      normalizeVersions('release', {
        Versions: [
          {
            AppName: 'release',
            SemVer: '0.5.2',
            Type: 'lambda-url',
            StartupType: 'direct',
            Status: 'routed',
          },
          {
            AppName: 'release',
            SemVer: '0.5.10',
            Type: 'lambda-url',
            StartupType: 'direct',
            Status: 'routed',
          },
          {
            AppName: 'release',
            SemVer: '0.0.0-pr.106',
            Type: 'lambda-url',
            StartupType: 'direct',
            Status: 'routed',
          },
        ],
        Rules: {
          AppName: 'release',
          RuleSet: {
            default: {
              SemVer: '0.5.2',
            },
          },
        },
      }).map((version) => ({
        semVer: version.semVer,
        isDefault: version.isDefault,
      })),
    ).toEqual([
      { semVer: '0.5.10', isDefault: false },
      { semVer: '0.5.2', isDefault: true },
      { semVer: '0.0.0-pr.106', isDefault: false },
    ]);
  });

  test('sorts rules with default first and marks rules that resolve to the default semver', () => {
    expect(
      normalizeRules(
        {
          Versions: [],
          Rules: {
            AppName: 'release',
            RuleSet: {
              organization: {
                SemVer: '0.5.2',
                AttributeName: 'organization',
                AttributeValue: 'ghpublic',
              },
              default: {
                SemVer: '0.5.2',
              },
              beta: {
                SemVer: '0.4.7',
              },
            },
          },
        },
        '0.5.2',
      ).map((rule) => ({
        key: rule.key,
        isDefault: rule.isDefault,
      })),
    ).toEqual([
      { key: 'default', isDefault: true },
      { key: 'beta', isDefault: false },
      { key: 'organization', isDefault: true },
    ]);
  });

  test('buildReleaseConsoleData keeps load errors while still selecting the requested app', () => {
    const data = buildReleaseConsoleData({
      applications: [
        { AppName: 'release', DisplayName: 'Release' },
        { AppName: 'blog', DisplayName: 'Blog' },
      ],
      requestedAppName: 'blog',
      loadError: 'Unable to load blog',
    });

    expect(data.selectedAppName).toBe('blog');
    expect(data.selectedAppDisplayName).toBe('Blog');
    expect(data.loadError).toBe('Unable to load blog');
    expect(data.versions).toEqual([]);
    expect(data.rules).toEqual([]);
  });

  test('buildReleaseConsoleData uses the selected app records for its rail entry', () => {
    const data = buildReleaseConsoleData({
      applications: [
        { AppName: 'release', DisplayName: 'release' },
        { AppName: 'blog', DisplayName: 'blog' },
      ],
      appSummaries: {
        // A stale summary must not contradict the freshly loaded records.
        release: { liveVersion: '0.4.7', versions: [] },
        blog: { liveVersion: '1.0.0', versions: [{ SemVer: '1.0.0', Status: 'routed' }] },
      },
      requestedAppName: 'release',
      versionsAndRules: records('0.5.2', ['0.5.3', '0.5.2']),
    });

    expect(data.apps.find((app) => app.appName === 'release')).toMatchObject({
      liveVersion: '0.5.2',
      newerRelease: '0.5.3',
    });
    expect(data.apps.find((app) => app.appName === 'blog')?.liveVersion).toBe('1.0.0');
  });
});
