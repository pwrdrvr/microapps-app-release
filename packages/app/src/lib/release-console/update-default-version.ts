import 'server-only';

import { GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { DbManager } from '@/lib/dbManager';
import type { RulesRecord } from './types';

export async function updateDefaultVersion(appName: string, semVer: string) {
  const partitionKey = `appname#${appName}`.toLowerCase();
  const response = await DbManager.instance.documentClient.send(
    new GetCommand({
      TableName: DbManager.instance.tableName,
      Key: {
        PK: partitionKey,
        SK: 'rules',
      },
    }),
  );

  const rulesRecord = (response.Item ?? {
    PK: partitionKey,
    SK: 'rules',
    AppName: appName,
    RuleSet: {},
    Version: 1,
  }) as RulesRecord & { PK: string; SK: 'rules' };

  rulesRecord.RuleSet = {
    ...(rulesRecord.RuleSet ?? {}),
    default: {
      SemVer: semVer,
      AttributeName: rulesRecord.RuleSet?.default?.AttributeName ?? '',
      AttributeValue: rulesRecord.RuleSet?.default?.AttributeValue ?? '',
    },
  };

  await DbManager.instance.documentClient.send(
    new PutCommand({
      TableName: DbManager.instance.tableName,
      Item: rulesRecord,
    }),
  );
}
