import { beforeEach, describe, expect, test, vi } from 'vitest';
import { GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { updateDefaultVersion } from './update-default-version';

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

describe('updateDefaultVersion', () => {
  beforeEach(() => {
    send.mockReset();
  });

  test('updates the default rule while preserving existing rule attributes', async () => {
    send
      .mockResolvedValueOnce({
        Item: {
          PK: 'appname#release',
          SK: 'rules',
          AppName: 'release',
          Version: 7,
          RuleSet: {
            default: {
              SemVer: '0.5.2',
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
      })
      .mockResolvedValueOnce({});

    await updateDefaultVersion('release', '0.5.3');

    expect(send).toHaveBeenCalledTimes(2);

    const getCommand = send.mock.calls[0][0];
    const putCommand = send.mock.calls[1][0];

    expect(getCommand).toBeInstanceOf(GetCommand);
    expect(getCommand.input).toEqual({
      TableName: 'microapps-core-ghpublic-prod',
      Key: {
        PK: 'appname#release',
        SK: 'rules',
      },
    });

    expect(putCommand).toBeInstanceOf(PutCommand);
    expect(putCommand.input).toEqual({
      TableName: 'microapps-core-ghpublic-prod',
      Item: {
        PK: 'appname#release',
        SK: 'rules',
        AppName: 'release',
        Version: 7,
        RuleSet: {
          default: {
            SemVer: '0.5.3',
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
    });
  });

  test('creates a new rules record when one does not exist', async () => {
    send.mockResolvedValueOnce({ Item: undefined }).mockResolvedValueOnce({});

    await updateDefaultVersion('release', '0.5.3');

    const putCommand = send.mock.calls[1][0];

    expect(putCommand.input).toEqual({
      TableName: 'microapps-core-ghpublic-prod',
      Item: {
        PK: 'appname#release',
        SK: 'rules',
        AppName: 'release',
        Version: 1,
        RuleSet: {
          default: {
            SemVer: '0.5.3',
            AttributeName: '',
            AttributeValue: '',
          },
        },
      },
    });
  });
});
