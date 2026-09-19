import { beforeEach, describe, expect, test, vi } from 'vitest';
import { GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { DefaultVersionError, updateDefaultVersion } from './update-default-version';

const { send } = vi.hoisted(() => ({
  send: vi.fn(),
}));

vi.mock('@/lib/dbManager', () => ({
  DbManager: {
    instance: {
      tableName: 'microapps-core-ghpublic-prod',
      documentClient: {
        send,
      },
    },
  },
}));

const TableName = 'microapps-core-ghpublic-prod';

function versionItem(semVer: string, Status = 'routed') {
  return {
    Item: {
      PK: 'appname#release',
      SK: `version#${semVer}`,
      AppName: 'release',
      SemVer: semVer,
      Type: 'lambda-url',
      StartupType: 'direct',
      Status,
    },
  };
}

function rulesItem(defaultSemVer: string) {
  return {
    Item: {
      PK: 'appname#release',
      SK: 'rules',
      AppName: 'release',
      Version: 7,
      RuleSet: {
        default: {
          SemVer: defaultSemVer,
          AttributeName: 'organization',
          AttributeValue: 'ghpublic',
        },
        beta: {
          SemVer: '0.4.7',
          AttributeName: 'organization',
          AttributeValue: 'beta-org',
        },
      },
    },
  };
}

function conditionalCheckFailed() {
  const error = new Error('The conditional request failed');
  error.name = 'ConditionalCheckFailedException';
  return error;
}

describe('updateDefaultVersion', () => {
  beforeEach(() => {
    send.mockReset();
  });

  test('changes only the default rule SemVer, conditional on the expected default', async () => {
    send
      .mockResolvedValueOnce(versionItem('0.5.3'))
      .mockResolvedValueOnce(rulesItem('0.5.2'))
      .mockResolvedValueOnce({});

    await expect(
      updateDefaultVersion({ appName: 'release', semVer: '0.5.3', expectedDefault: '0.5.2' }),
    ).resolves.toEqual({ previousDefault: '0.5.2', changed: true });

    const [versionGet, rulesGet, update] = send.mock.calls.map(([command]) => command);

    expect(versionGet).toBeInstanceOf(GetCommand);
    expect(versionGet.input).toEqual({
      TableName,
      Key: { PK: 'appname#release', SK: 'version#0.5.3' },
    });
    expect(rulesGet.input).toEqual({
      TableName,
      Key: { PK: 'appname#release', SK: 'rules' },
      ConsistentRead: true,
    });
    expect(update).toBeInstanceOf(UpdateCommand);
    expect(update.input).toEqual({
      TableName,
      Key: { PK: 'appname#release', SK: 'rules' },
      UpdateExpression: 'SET RuleSet.#default.SemVer = :semVer',
      ConditionExpression: 'RuleSet.#default.SemVer = :expected',
      ExpressionAttributeNames: { '#default': 'default' },
      ExpressionAttributeValues: { ':semVer': '0.5.3', ':expected': '0.5.2' },
    });
  });

  test('lowercases the version key the way the deployer writes it', async () => {
    send.mockResolvedValueOnce({ Item: undefined });

    await expect(
      updateDefaultVersion({ appName: 'Release', semVer: '1.0.0-RC.1', expectedDefault: '0.5.2' }),
    ).rejects.toMatchObject({ status: 404 });

    expect(send.mock.calls[0][0].input.Key).toEqual({
      PK: 'appname#release',
      SK: 'version#1.0.0-rc.1',
    });
  });

  test('refuses a version that does not exist without touching the rules', async () => {
    send.mockResolvedValueOnce({ Item: undefined });

    await expect(
      updateDefaultVersion({ appName: 'release', semVer: '9.9.9', expectedDefault: '0.5.2' }),
    ).rejects.toMatchObject({ status: 404, message: 'release has no version 9.9.9.' });
    expect(send).toHaveBeenCalledTimes(1);
  });

  test('refuses a version that is not routed yet', async () => {
    send.mockResolvedValueOnce(versionItem('0.6.0', 'integrated'));

    await expect(
      updateDefaultVersion({ appName: 'release', semVer: '0.6.0', expectedDefault: '0.5.2' }),
    ).rejects.toMatchObject({
      status: 422,
      message: 'release 0.6.0 is integrated and cannot serve traffic yet.',
    });
    expect(send).toHaveBeenCalledTimes(1);
  });

  test('returns 409 with the actual default when the page was stale', async () => {
    send.mockResolvedValueOnce(versionItem('0.4.7')).mockResolvedValueOnce(rulesItem('0.5.4'));

    const error = await updateDefaultVersion({
      appName: 'release',
      semVer: '0.4.7',
      expectedDefault: '0.5.3',
    }).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(DefaultVersionError);
    expect(error).toMatchObject({ status: 409, actualDefault: '0.5.4' });
    expect(send).toHaveBeenCalledTimes(2);
  });

  test('returns 409 when the default moves between the read and the conditional write', async () => {
    send
      .mockResolvedValueOnce(versionItem('0.4.7'))
      .mockResolvedValueOnce(rulesItem('0.5.3'))
      .mockRejectedValueOnce(conditionalCheckFailed())
      .mockResolvedValueOnce(rulesItem('0.5.4'));

    await expect(
      updateDefaultVersion({ appName: 'release', semVer: '0.4.7', expectedDefault: '0.5.3' }),
    ).rejects.toMatchObject({ status: 409, actualDefault: '0.5.4' });
  });

  test('is a no-op when the version is already the default', async () => {
    send.mockResolvedValueOnce(versionItem('0.5.3')).mockResolvedValueOnce(rulesItem('0.5.3'));

    await expect(
      updateDefaultVersion({ appName: 'release', semVer: '0.5.3', expectedDefault: '0.5.3' }),
    ).resolves.toEqual({ previousDefault: '0.5.3', changed: false });
    expect(send).toHaveBeenCalledTimes(2);
  });

  test('creates the rules record when the app has none', async () => {
    send
      .mockResolvedValueOnce(versionItem('0.5.3'))
      .mockResolvedValueOnce({ Item: undefined })
      .mockResolvedValueOnce({});

    await expect(
      updateDefaultVersion({ appName: 'release', semVer: '0.5.3', expectedDefault: null }),
    ).resolves.toEqual({ previousDefault: null, changed: true });

    const put = send.mock.calls[2][0];
    expect(put).toBeInstanceOf(PutCommand);
    expect(put.input).toEqual({
      TableName,
      Item: {
        PK: 'appname#release',
        SK: 'rules',
        AppName: 'release',
        Version: 1,
        RuleSet: {
          default: { SemVer: '0.5.3', AttributeName: '', AttributeValue: '' },
        },
      },
      ConditionExpression: 'attribute_not_exists(PK)',
    });
  });

  test('adds a default rule next to existing attribute rules', async () => {
    const rules = rulesItem('unused');
    delete (rules.Item.RuleSet as Record<string, unknown>).default;
    send
      .mockResolvedValueOnce(versionItem('0.5.3'))
      .mockResolvedValueOnce(rules)
      .mockResolvedValueOnce({});

    await updateDefaultVersion({ appName: 'release', semVer: '0.5.3', expectedDefault: null });

    expect(send.mock.calls[2][0].input).toMatchObject({
      UpdateExpression: 'SET RuleSet.#default = :rule',
      ConditionExpression: 'attribute_not_exists(RuleSet.#default)',
      ExpressionAttributeValues: {
        ':rule': { SemVer: '0.5.3', AttributeName: '', AttributeValue: '' },
      },
    });
  });
});
