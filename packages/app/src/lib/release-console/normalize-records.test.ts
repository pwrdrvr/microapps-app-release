import { describe, expect, test } from 'vitest';
import {
  buildReleaseConsoleData,
  normalizeApps,
  normalizeRules,
  normalizeVersions,
  selectAppName,
} from './normalize-records';

describe('normalize-records', () => {
  test('falls back to app name when display name is blank and sorts case-insensitively', () => {
    expect(
      normalizeApps([
        { AppName: 'zeta', DisplayName: '' },
        { AppName: 'Alpha', DisplayName: 'Alpha' },
      ]),
    ).toEqual([
      { appName: 'Alpha', displayName: 'Alpha' },
      { appName: 'zeta', displayName: 'zeta' },
    ]);
  });

  test('respects a requested app when it exists and falls back to release otherwise', () => {
    const apps = [
      { appName: 'blog', displayName: 'Blog' },
      { appName: 'release', displayName: 'Release' },
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
});
