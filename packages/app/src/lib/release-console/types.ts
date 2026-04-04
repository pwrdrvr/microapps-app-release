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

export interface ReleaseConsoleApp {
  appName: string;
  displayName: string;
}

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
}

export interface ReleaseConsoleRule {
  key: string;
  attributeName: string;
  attributeValue: string;
  semVer: string;
  isDefault: boolean;
}

export interface ReleaseConsoleData {
  apps: ReleaseConsoleApp[];
  selectedAppName: string | null;
  selectedAppDisplayName: string | null;
  versions: ReleaseConsoleVersion[];
  rules: ReleaseConsoleRule[];
  defaultVersion: string | null;
  loadError: string | null;
}
