import semver from 'semver';
import type {
  ApplicationRecord,
  ReleaseConsoleApp,
  ReleaseConsoleData,
  ReleaseConsoleRule,
  ReleaseConsoleVersion,
  VersionsAndRulesRecord,
} from './types';

function sortByLabel(left: ReleaseConsoleApp, right: ReleaseConsoleApp) {
  const displayComparison = left.displayName.localeCompare(right.displayName, undefined, {
    sensitivity: 'base',
  });

  if (displayComparison !== 0) {
    return displayComparison;
  }

  return left.appName.localeCompare(right.appName, undefined, {
    sensitivity: 'base',
  });
}

function compareVersions(left: { semVer: string }, right: { semVer: string }) {
  const leftValid = semver.valid(left.semVer);
  const rightValid = semver.valid(right.semVer);

  if (leftValid && rightValid) {
    return semver.rcompare(left.semVer, right.semVer);
  }

  return right.semVer.localeCompare(left.semVer, undefined, { numeric: true, sensitivity: 'base' });
}

export function normalizeApps(applications: ApplicationRecord[]): ReleaseConsoleApp[] {
  return applications
    .map((app) => ({
      appName: app.AppName,
      displayName: app.DisplayName || app.AppName,
    }))
    .sort(sortByLabel);
}

export function selectAppName(apps: ReleaseConsoleApp[], requestedAppName?: string): string | null {
  if (apps.length === 0) {
    return null;
  }

  if (requestedAppName) {
    const matchingApp = apps.find((app) => app.appName === requestedAppName);
    if (matchingApp) {
      return matchingApp.appName;
    }
  }

  const releaseApp = apps.find((app) => app.appName === 'release');
  return releaseApp?.appName ?? apps[0].appName;
}

export function normalizeVersions(
  selectedAppName: string,
  versionsAndRules?: VersionsAndRulesRecord | null,
): ReleaseConsoleVersion[] {
  const defaultVersion = versionsAndRules?.Rules?.RuleSet?.default?.SemVer ?? null;
  const versions = versionsAndRules?.Versions ?? [];

  return versions
    .map((version) => ({
      appName: selectedAppName,
      semVer: version.SemVer,
      type: version.Type,
      startupType: version.StartupType,
      status: version.Status,
      defaultFile: version.DefaultFile ?? '',
      integrationId: version.IntegrationID ?? '',
      url: version.URL ?? '',
      lambdaArn: version.LambdaARN ?? '',
      isDefault: version.SemVer === defaultVersion,
    }))
    .sort(compareVersions);
}

export function normalizeRules(
  versionsAndRules?: VersionsAndRulesRecord | null,
  defaultVersion?: string | null,
): ReleaseConsoleRule[] {
  const rules = versionsAndRules?.Rules?.RuleSet ?? {};

  return Object.entries(rules)
    .map(([key, rule]) => ({
      key,
      attributeName: rule.AttributeName ?? '',
      attributeValue: rule.AttributeValue ?? '',
      semVer: rule.SemVer,
      isDefault: key === 'default' || rule.SemVer === defaultVersion,
    }))
    .sort((left, right) => {
      if (left.key === 'default') {
        return -1;
      }

      if (right.key === 'default') {
        return 1;
      }

      return left.key.localeCompare(right.key, undefined, { sensitivity: 'base' });
    });
}

export function buildReleaseConsoleData({
  applications,
  requestedAppName,
  versionsAndRules,
  loadError = null,
}: {
  applications: ApplicationRecord[];
  requestedAppName?: string;
  versionsAndRules?: VersionsAndRulesRecord | null;
  loadError?: string | null;
}): ReleaseConsoleData {
  const apps = normalizeApps(applications);
  const selectedAppName = selectAppName(apps, requestedAppName);
  const selectedAppDisplayName =
    apps.find((app) => app.appName === selectedAppName)?.displayName ?? selectedAppName;
  const defaultVersion = versionsAndRules?.Rules?.RuleSet?.default?.SemVer ?? null;

  return {
    apps,
    selectedAppName,
    selectedAppDisplayName,
    versions:
      selectedAppName === null ? [] : normalizeVersions(selectedAppName, versionsAndRules ?? null),
    rules: normalizeRules(versionsAndRules ?? null, defaultVersion),
    defaultVersion,
    loadError,
  };
}
