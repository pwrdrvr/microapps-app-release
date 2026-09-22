import semver from 'semver';
import { isPromotable } from './status';
import type {
  AppSummaryRecord,
  ApplicationRecord,
  ReleaseConsoleApp,
  ReleaseConsoleData,
  ReleaseConsoleRule,
  ReleaseConsoleSource,
  ReleaseConsoleVersion,
  ReleaseVersionRelation,
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

/** PR and other prerelease builds (`0.0.0-pr.106`) are kept out of release ranking. */
export function isPrereleaseVersion(semVer: string) {
  return semver.valid(semVer) ? semver.prerelease(semVer) !== null : semVer.includes('-');
}

/** Newest promotable release above `liveVersion`, or null when the live default is newest. */
export function findNewerRelease(
  liveVersion: string | null,
  versions: AppSummaryRecord['versions'],
): string | null {
  if (liveVersion === null || !semver.valid(liveVersion)) {
    return null;
  }

  const newer = versions
    .filter(
      (version) =>
        isPromotable(version.Status) &&
        !isPrereleaseVersion(version.SemVer) &&
        semver.valid(version.SemVer) &&
        semver.gt(version.SemVer, liveVersion),
    )
    .sort((left, right) => semver.rcompare(left.SemVer, right.SemVer));

  return newer[0]?.SemVer ?? null;
}

export function normalizeApps(
  applications: ApplicationRecord[],
  summaries: Record<string, AppSummaryRecord> = {},
): ReleaseConsoleApp[] {
  return applications
    .map((app) => {
      const summary = summaries[app.AppName];
      const liveVersion = summary?.liveVersion ?? null;

      return {
        appName: app.AppName,
        displayName: app.DisplayName || app.AppName,
        liveVersion,
        newerRelease: summary ? findNewerRelease(liveVersion, summary.versions) : null,
      };
    })
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

function rankAgainstLive(
  semVer: string,
  isPrerelease: boolean,
  defaultVersion: string | null,
  releases: string[],
): { relation: ReleaseVersionRelation; distance: number; between: string[] } {
  if (semVer === defaultVersion) {
    return { relation: 'live', distance: 0, between: [] };
  }

  if (isPrerelease) {
    return { relation: 'prerelease', distance: 0, between: [] };
  }

  if (defaultVersion === null || !semver.valid(defaultVersion) || !semver.valid(semVer)) {
    return { relation: 'unranked', distance: 0, between: [] };
  }

  if (semver.gt(semVer, defaultVersion)) {
    const crossed = releases.filter(
      (release) => semver.gt(release, defaultVersion) && semver.lte(release, semVer),
    );
    return {
      relation: 'newer',
      distance: crossed.length,
      between: crossed.filter((release) => release !== semVer),
    };
  }

  const crossed = releases.filter(
    (release) => semver.gte(release, semVer) && semver.lt(release, defaultVersion),
  );
  return {
    relation: 'older',
    distance: crossed.length,
    between: crossed.filter((release) => release !== semVer),
  };
}

export function normalizeVersions(
  selectedAppName: string,
  versionsAndRules?: VersionsAndRulesRecord | null,
): ReleaseConsoleVersion[] {
  const defaultVersion = versionsAndRules?.Rules?.RuleSet?.default?.SemVer ?? null;
  const versions = (versionsAndRules?.Versions ?? [])
    .map((version) => ({ version, semVer: version.SemVer }))
    .sort(compareVersions);
  const releases = versions
    .map(({ semVer }) => semVer)
    .filter((semVer) => !isPrereleaseVersion(semVer) && semver.valid(semVer));

  return versions.map(({ version }) => {
    const isPrerelease = isPrereleaseVersion(version.SemVer);

    return {
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
      isPrerelease,
      promotable: isPromotable(version.Status),
      ...rankAgainstLive(version.SemVer, isPrerelease, defaultVersion, releases),
    };
  });
}

export function normalizeRules(
  versionsAndRules?: VersionsAndRulesRecord | null,
  defaultVersion?: string | null,
): ReleaseConsoleRule[] {
  const rules = versionsAndRules?.Rules?.RuleSet ?? {};
  const deployedVersions = new Set((versionsAndRules?.Versions ?? []).map((v) => v.SemVer));

  return Object.entries(rules)
    .map(([key, rule]) => ({
      key,
      attributeName: rule.AttributeName ?? '',
      attributeValue: rule.AttributeValue ?? '',
      semVer: rule.SemVer,
      isDefault: key === 'default',
      servesLiveVersion: rule.SemVer === defaultVersion,
      isDangling: !deployedVersions.has(rule.SemVer),
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
  appSummaries,
  requestedAppName,
  versionsAndRules,
  loadError = null,
  source = { tableName: '', region: null, loadedAt: '' },
}: {
  applications: ApplicationRecord[];
  appSummaries?: Record<string, AppSummaryRecord>;
  requestedAppName?: string;
  versionsAndRules?: VersionsAndRulesRecord | null;
  loadError?: string | null;
  source?: ReleaseConsoleSource;
}): ReleaseConsoleData {
  const selectedAppName = selectAppName(normalizeApps(applications), requestedAppName);
  const defaultVersion = versionsAndRules?.Rules?.RuleSet?.default?.SemVer ?? null;
  // The selected app's full records are fresher than its rail summary, so the rail and
  // the main pane can never disagree about what is live.
  const summaries =
    selectedAppName !== null && versionsAndRules
      ? {
          ...appSummaries,
          [selectedAppName]: { liveVersion: defaultVersion, versions: versionsAndRules.Versions },
        }
      : appSummaries;
  const apps = normalizeApps(applications, summaries);
  const selectedAppDisplayName =
    apps.find((app) => app.appName === selectedAppName)?.displayName ?? selectedAppName;

  return {
    apps,
    selectedAppName,
    selectedAppDisplayName,
    versions:
      selectedAppName === null ? [] : normalizeVersions(selectedAppName, versionsAndRules ?? null),
    rules: normalizeRules(versionsAndRules ?? null, defaultVersion),
    defaultVersion,
    loadError,
    source,
  };
}
