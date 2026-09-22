import { describe, expect, test } from 'vitest';
import { buildReleaseConsoleData } from './normalize-records';
import type { ApplicationRecord } from './types';

function createApplication(appName: string, displayName = appName) {
  return { AppName: appName, DisplayName: displayName } satisfies ApplicationRecord;
}

describe('buildReleaseConsoleData', () => {
  test('prefers release when no app is requested', () => {
    const data = buildReleaseConsoleData({
      applications: [createApplication('blog'), createApplication('release')],
      versionsAndRules: {
        Versions: [
          {
            AppName: 'release',
            SemVer: '0.5.2',
            Type: 'lambda-url',
            StartupType: 'direct',
            Status: 'routed',
            URL: 'https://example.com',
          },
        ],
        Rules: {
          AppName: 'release',
          RuleSet: {
            default: {
              SemVer: '0.5.2',
              AttributeName: '',
              AttributeValue: '',
            },
          },
          Version: 1,
        },
      },
    });

    expect(data.selectedAppName).toBe('release');
    expect(data.defaultVersion).toBe('0.5.2');
    expect(data.versions[0]?.isDefault).toBe(true);
  });

  test('falls back to the first sorted app when release is absent', () => {
    const data = buildReleaseConsoleData({
      applications: [createApplication('zeta'), createApplication('alpha')],
    });

    expect(data.selectedAppName).toBe('alpha');
  });
});
