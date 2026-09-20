export type ReleaseVersionStatus =
  | 'pending'
  | 'assets-copied'
  | 'permissioned'
  | 'integrated'
  | 'routed'
  | 'deployed';

export type ReleaseRouteType = 'static' | 'lambda' | 'lambda-url' | 'url';
export type ReleaseStartupType = 'iframe' | 'direct';

export interface ApplicationRecord {
  AppName: string;
  DisplayName: string;
}

export interface VersionRecord {
  AppName: string;
  SemVer: string;
  Type: ReleaseRouteType;
  StartupType: ReleaseStartupType;
  Status: ReleaseVersionStatus;
  DefaultFile?: string;
  IntegrationID?: string;
  URL?: string;
  LambdaARN?: string;
}

export interface RuleRecord {
  SemVer: string;
  AttributeName?: string;
  AttributeValue?: string;
}

export interface RulesRecord {
  AppName: string;
  RuleSet?: Record<string, RuleRecord>;
  Version?: number;
}

export interface VersionsAndRulesRecord {
  Versions: VersionRecord[];
  Rules: RulesRecord | null;
}

export interface AppSummaryRecord {
  /** `RuleSet.default.SemVer`, or null when the app has no default rule. */
  liveVersion: string | null;
  versions: Pick<VersionRecord, 'SemVer' | 'Status'>[];
}

export interface ReleaseConsoleApp {
  appName: string;
  displayName: string;
  /** Null when the app has no default rule or its summary could not be loaded. */
  liveVersion: string | null;
  /** Newest promotable release above the live default, if there is one. */
  newerRelease: string | null;
}

/**
 * Where a version sits relative to the live default:
 * - `newer` / `older`: a release above or below it (`distance` counts the releases crossed);
 * - `prerelease`: a PR or other prerelease build, never ranked against releases;
 * - `unranked`: there is no comparable live default to rank against.
 */
export type ReleaseVersionRelation = 'live' | 'newer' | 'older' | 'prerelease' | 'unranked';

export interface ReleaseConsoleVersion {
  appName: string;
  semVer: string;
  type: ReleaseRouteType;
  startupType: ReleaseStartupType;
  status: ReleaseVersionStatus;
  defaultFile: string;
  integrationId: string;
  url: string;
  lambdaArn: string;
  isDefault: boolean;
  isPrerelease: boolean;
  /** Only `routed` and `deployed` versions can be made the default. */
  promotable: boolean;
  relation: ReleaseVersionRelation;
  distance: number;
  /** Releases strictly between this version and the live default, newest first. */
  between: string[];
}

export interface ReleaseConsoleRule {
  key: string;
  attributeName: string;
  attributeValue: string;
  semVer: string;
  /** The `default` rule: the only one the MicroApps router evaluates today. */
  isDefault: boolean;
  /** This rule points at the version currently serving as the default. */
  servesLiveVersion: boolean;
  /** No version record exists for this rule's SemVer. */
  isDangling: boolean;
}

export interface ReleaseConsoleData {
  apps: ReleaseConsoleApp[];
  selectedAppName: string | null;
  selectedAppDisplayName: string | null;
  versions: ReleaseConsoleVersion[];
  rules: ReleaseConsoleRule[];
  defaultVersion: string | null;
  loadError: string | null;
  source: ReleaseConsoleSource;
}

export interface ReleaseConsoleSource {
  tableName: string;
  region: string | null;
  loadedAt: string;
}
