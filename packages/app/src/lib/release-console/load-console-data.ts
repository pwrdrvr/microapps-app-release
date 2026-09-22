import 'server-only';

import {
  BatchGetCommand,
  type BatchGetCommandOutput,
  GetCommand,
  QueryCommand,
  type QueryCommandInput,
} from '@aws-sdk/lib-dynamodb';
import { unstable_noStore as noStore } from 'next/cache';
import { DbManager } from '@/lib/dbManager';
import type {
  AppSummaryRecord,
  ApplicationRecord,
  ReleaseConsoleSource,
  RulesRecord,
  VersionRecord,
  VersionsAndRulesRecord,
} from './types';
import { buildReleaseConsoleData } from './normalize-records';

// BatchGetItem accepts at most 100 keys per request.
const BATCH_GET_LIMIT = 100;
const SUMMARY_QUERY_CONCURRENCY = 8;
const UNPROCESSED_RETRY_DELAYS_MS = [0, 50, 200];

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Unknown release console error';
}

function partitionKeyFor(appName: string) {
  return `appname#${appName}`.toLowerCase();
}

async function queryAll<T>(input: QueryCommandInput): Promise<T[]> {
  const items: T[] = [];
  let ExclusiveStartKey: QueryCommandInput['ExclusiveStartKey'];

  do {
    const response = await DbManager.instance.documentClient.send(
      new QueryCommand({ ...input, ExclusiveStartKey }),
    );
    items.push(...((response.Items ?? []) as T[]));
    ExclusiveStartKey = response.LastEvaluatedKey;
  } while (ExclusiveStartKey);

  return items;
}

async function loadDefaultVersions(appNames: string[]) {
  const { documentClient, tableName } = DbManager.instance;
  const liveVersions = new Map<string, string | null>();

  for (let start = 0; start < appNames.length; start += BATCH_GET_LIMIT) {
    let keys: Record<string, unknown>[] | undefined = appNames
      .slice(start, start + BATCH_GET_LIMIT)
      .map((appName) => ({ PK: partitionKeyFor(appName), SK: 'rules' }));

    // DynamoDB hands back unprocessed keys when it is throttling, so an immediate
    // retry is likely to be throttled too; back off before each retry.
    for (
      let attempt = 0;
      keys && keys.length > 0 && attempt < UNPROCESSED_RETRY_DELAYS_MS.length;
      attempt += 1
    ) {
      if (UNPROCESSED_RETRY_DELAYS_MS[attempt] > 0) {
        await new Promise((resolve) => setTimeout(resolve, UNPROCESSED_RETRY_DELAYS_MS[attempt]));
      }

      const response: BatchGetCommandOutput = await documentClient.send(
        new BatchGetCommand({
          RequestItems: {
            [tableName]: { Keys: keys, ProjectionExpression: 'PK, RuleSet' },
          },
        }),
      );

      for (const item of response.Responses?.[tableName] ?? []) {
        const rules = item as Pick<RulesRecord, 'RuleSet'> & { PK: string };
        liveVersions.set(rules.PK, rules.RuleSet?.default?.SemVer ?? null);
      }

      keys = response.UnprocessedKeys?.[tableName]?.Keys;
    }
  }

  return liveVersions;
}

async function loadVersionStatuses(appName: string) {
  return queryAll<AppSummaryRecord['versions'][number]>({
    TableName: DbManager.instance.tableName,
    KeyConditionExpression: 'PK = :pk and begins_with(SK, :versionPrefix)',
    ProjectionExpression: 'SemVer, #status',
    ExpressionAttributeNames: { '#status': 'Status' },
    ExpressionAttributeValues: {
      ':pk': partitionKeyFor(appName),
      ':versionPrefix': 'version#',
    },
  });
}

async function loadAllVersionStatuses(appNames: string[]) {
  const versionsByApp = new Map<string, AppSummaryRecord['versions']>();

  for (let start = 0; start < appNames.length; start += SUMMARY_QUERY_CONCURRENCY) {
    const chunk = appNames.slice(start, start + SUMMARY_QUERY_CONCURRENCY);
    const results = await Promise.all(chunk.map((appName) => loadVersionStatuses(appName)));
    chunk.forEach((appName, index) => versionsByApp.set(appName, results[index]));
  }

  return versionsByApp;
}

/**
 * The live default and version statuses of each app, for the app rail. This is
 * best-effort: a failure leaves the rail without versions but never fails the page.
 */
async function loadAppSummaries(appNames: string[]): Promise<Record<string, AppSummaryRecord>> {
  if (appNames.length === 0) {
    return {};
  }

  try {
    const [liveVersions, versionsByApp] = await Promise.all([
      loadDefaultVersions(appNames),
      loadAllVersionStatuses(appNames),
    ]);

    return Object.fromEntries(
      appNames.map((appName) => [
        appName,
        {
          liveVersion: liveVersions.get(partitionKeyFor(appName)) ?? null,
          versions: versionsByApp.get(appName) ?? [],
        },
      ]),
    );
  } catch {
    return {};
  }
}

export async function loadReleaseConsoleData(requestedAppName?: string) {
  noStore();

  const source = (): ReleaseConsoleSource => ({
    tableName: DbManager.instance.tableName,
    region: process.env.AWS_REGION ?? process.env.AWS_DEFAULT_REGION ?? null,
    loadedAt: new Date().toISOString(),
  });

  let applications: ApplicationRecord[] = [];

  try {
    applications = await queryAll<ApplicationRecord>({
      TableName: DbManager.instance.tableName,
      KeyConditionExpression: 'PK = :pk',
      ExpressionAttributeValues: {
        ':pk': 'applications',
      },
    });
  } catch (error) {
    return buildReleaseConsoleData({
      applications: [],
      requestedAppName,
      loadError: `Unable to load applications: ${getErrorMessage(error)}`,
      source: source(),
    });
  }

  const baseData = buildReleaseConsoleData({
    applications,
    requestedAppName,
  });

  if (baseData.selectedAppName === null) {
    return { ...baseData, source: source() };
  }

  const selectedAppName = baseData.selectedAppName;
  const appSummariesPromise = loadAppSummaries(
    applications.map((app) => app.AppName).filter((appName) => appName !== selectedAppName),
  );

  try {
    const appPartitionKey = partitionKeyFor(selectedAppName);
    const [versions, rulesResponse] = await Promise.all([
      queryAll<VersionRecord>({
        TableName: DbManager.instance.tableName,
        KeyConditionExpression: 'PK = :pk and begins_with(SK, :versionPrefix)',
        ExpressionAttributeValues: {
          ':pk': appPartitionKey,
          ':versionPrefix': 'version#',
        },
      }),
      DbManager.instance.documentClient.send(
        new GetCommand({
          TableName: DbManager.instance.tableName,
          Key: {
            PK: appPartitionKey,
            SK: 'rules',
          },
          // Read-after-write: the refresh that follows a default change must see it.
          ConsistentRead: true,
        }),
      ),
    ]);

    const versionsAndRules: VersionsAndRulesRecord = {
      Versions: versions,
      Rules: (rulesResponse.Item ?? null) as RulesRecord | null,
    };

    return buildReleaseConsoleData({
      applications,
      appSummaries: await appSummariesPromise,
      requestedAppName: selectedAppName,
      versionsAndRules,
      source: source(),
    });
  } catch (error) {
    return buildReleaseConsoleData({
      applications,
      appSummaries: await appSummariesPromise,
      requestedAppName: selectedAppName,
      loadError: `Unable to load ${selectedAppName}: ${getErrorMessage(error)}`,
      source: source(),
    });
  }
}
