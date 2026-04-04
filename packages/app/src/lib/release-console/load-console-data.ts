import 'server-only';

import { GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { unstable_noStore as noStore } from 'next/cache';
import { DbManager } from '@/lib/dbManager';
import type {
  ApplicationRecord,
  RulesRecord,
  VersionRecord,
  VersionsAndRulesRecord,
} from './types';
import { buildReleaseConsoleData } from './normalize-records';

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Unknown release console error';
}

export async function loadReleaseConsoleData(requestedAppName?: string) {
  noStore();

  let applications: ApplicationRecord[] = [];

  try {
    const response = await DbManager.instance.documentClient.send(
      new QueryCommand({
        TableName: DbManager.instance.tableName,
        KeyConditionExpression: 'PK = :pk',
        ExpressionAttributeValues: {
          ':pk': 'applications',
        },
      }),
    );

    applications = (response.Items ?? []) as ApplicationRecord[];
  } catch (error) {
    return buildReleaseConsoleData({
      applications: [],
      requestedAppName,
      loadError: `Unable to load applications: ${getErrorMessage(error)}`,
    });
  }

  const baseData = buildReleaseConsoleData({
    applications,
    requestedAppName,
  });

  if (baseData.selectedAppName === null) {
    return baseData;
  }

  try {
    const appPartitionKey = `appname#${baseData.selectedAppName}`.toLowerCase();
    const [versionsResponse, rulesResponse] = await Promise.all([
      DbManager.instance.documentClient.send(
        new QueryCommand({
          TableName: DbManager.instance.tableName,
          KeyConditionExpression: 'PK = :pk and begins_with(SK, :versionPrefix)',
          ExpressionAttributeValues: {
            ':pk': appPartitionKey,
            ':versionPrefix': 'version#',
          },
        }),
      ),
      DbManager.instance.documentClient.send(
        new GetCommand({
          TableName: DbManager.instance.tableName,
          Key: {
            PK: appPartitionKey,
            SK: 'rules',
          },
        }),
      ),
    ]);

    const versionsAndRules: VersionsAndRulesRecord = {
      Versions: (versionsResponse.Items ?? []) as VersionRecord[],
      Rules: (rulesResponse.Item ?? null) as RulesRecord | null,
    };

    return buildReleaseConsoleData({
      applications,
      requestedAppName: baseData.selectedAppName,
      versionsAndRules,
    });
  } catch (error) {
    return buildReleaseConsoleData({
      applications,
      requestedAppName: baseData.selectedAppName,
      loadError: `Unable to load ${baseData.selectedAppName}: ${getErrorMessage(error)}`,
    });
  }
}
