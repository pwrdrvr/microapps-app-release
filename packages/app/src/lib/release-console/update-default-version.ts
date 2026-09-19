import 'server-only';

import { GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { DbManager } from '@/lib/dbManager';
import type { RulesRecord, VersionRecord } from './types';

// The deployer marks a version `routed` once its routes are live; `deployed` is the
// terminal state. Earlier statuses cannot serve traffic yet.
export const PROMOTABLE_STATUSES: ReadonlySet<VersionRecord['Status']> = new Set([
  'routed',
  'deployed',
]);

export class DefaultVersionError extends Error {
  public constructor(
    message: string,
    public readonly status: 404 | 409 | 422,
    public readonly actualDefault?: string | null,
  ) {
    super(message);
    this.name = 'DefaultVersionError';
  }
}

export interface UpdateDefaultVersionInput {
  appName: string;
  semVer: string;
  /** The default the operator saw when they confirmed; `null` when the app had none. */
  expectedDefault: string | null;
}

export interface UpdateDefaultVersionResult {
  previousDefault: string | null;
  changed: boolean;
}

type RulesItem = RulesRecord & { PK: string; SK: 'rules' };

function conflict(appName: string, expectedDefault: string | null, actualDefault: string | null) {
  return new DefaultVersionError(
    `The ${appName} default changed to ${actualDefault ?? 'unset'} (expected ${
      expectedDefault ?? 'unset'
    }). Nothing was written.`,
    409,
    actualDefault,
  );
}

async function loadRules(partitionKey: string) {
  const response = await DbManager.instance.documentClient.send(
    new GetCommand({
      TableName: DbManager.instance.tableName,
      Key: { PK: partitionKey, SK: 'rules' },
      ConsistentRead: true,
    }),
  );

  return (response.Item ?? null) as RulesItem | null;
}

export async function updateDefaultVersion({
  appName,
  semVer,
  expectedDefault,
}: UpdateDefaultVersionInput): Promise<UpdateDefaultVersionResult> {
  const partitionKey = `appname#${appName}`.toLowerCase();
  const { documentClient, tableName } = DbManager.instance;

  const versionResponse = await documentClient.send(
    new GetCommand({
      TableName: tableName,
      Key: { PK: partitionKey, SK: `version#${semVer}`.toLowerCase() },
    }),
  );
  const version = versionResponse.Item as VersionRecord | undefined;

  if (!version) {
    throw new DefaultVersionError(`${appName} has no version ${semVer}.`, 404);
  }

  if (!PROMOTABLE_STATUSES.has(version.Status)) {
    throw new DefaultVersionError(
      `${appName} ${semVer} is ${version.Status} and cannot serve traffic yet.`,
      422,
    );
  }

  const rules = await loadRules(partitionKey);
  const actualDefault = rules?.RuleSet?.default?.SemVer ?? null;

  if (actualDefault !== expectedDefault) {
    throw conflict(appName, expectedDefault, actualDefault);
  }

  if (actualDefault === semVer) {
    return { previousDefault: actualDefault, changed: false };
  }

  try {
    if (rules?.RuleSet) {
      // Only the default rule's SemVer changes; attribute rules and the default
      // rule's own attribute match are left exactly as they are.
      await documentClient.send(
        new UpdateCommand({
          TableName: tableName,
          Key: { PK: partitionKey, SK: 'rules' },
          UpdateExpression:
            expectedDefault === null
              ? 'SET RuleSet.#default = :rule'
              : 'SET RuleSet.#default.SemVer = :semVer',
          ConditionExpression:
            expectedDefault === null
              ? 'attribute_not_exists(RuleSet.#default)'
              : 'RuleSet.#default.SemVer = :expected',
          ExpressionAttributeNames: { '#default': 'default' },
          ExpressionAttributeValues:
            expectedDefault === null
              ? { ':rule': { SemVer: semVer, AttributeName: '', AttributeValue: '' } }
              : { ':semVer': semVer, ':expected': expectedDefault },
        }),
      );
    } else {
      await documentClient.send(
        new PutCommand({
          TableName: tableName,
          Item: {
            ...(rules ?? { PK: partitionKey, SK: 'rules', AppName: appName, Version: 1 }),
            RuleSet: { default: { SemVer: semVer, AttributeName: '', AttributeValue: '' } },
          },
          ConditionExpression: rules ? 'attribute_not_exists(RuleSet)' : 'attribute_not_exists(PK)',
        }),
      );
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'ConditionalCheckFailedException') {
      const latest = await loadRules(partitionKey);
      throw conflict(appName, expectedDefault, latest?.RuleSet?.default?.SemVer ?? null);
    }

    throw error;
  }

  return { previousDefault: actualDefault, changed: true };
}
