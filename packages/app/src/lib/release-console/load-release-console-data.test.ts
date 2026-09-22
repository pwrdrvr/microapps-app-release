import { beforeEach, describe, expect, test, vi } from 'vitest';
import { BatchGetCommand, GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { loadReleaseConsoleData } from './load-console-data';

const { send } = vi.hoisted(() => ({
  send: vi.fn(),
}));

vi.mock('next/cache', () => ({
  unstable_noStore: () => undefined,
}));

vi.mock('@/lib/dbManager', () => ({
  DbManager: {
    instance: {
      tableName: 'MicroApps',
      documentClient: { send },
    },
  },
}));

const TableName = 'MicroApps';

function rules(appName: string, semVer: string) {
  return { PK: `appname#${appName}`, RuleSet: { default: { SemVer: semVer } } };
}

function version(appName: string, SemVer: string, Status = 'routed') {
  return { AppName: appName, SemVer, Status, Type: 'lambda-url', StartupType: 'direct' };
}

type Handler = (command: unknown) => unknown;

function routeCommands({
  batchGet = () => ({
    Responses: { [TableName]: [rules('blog', '1.0.0'), rules('nextjs-demo', '0.6.3')] },
  }),
}: { batchGet?: Handler } = {}) {
  send.mockImplementation(async (command: unknown) => {
    if (command instanceof BatchGetCommand) {
      return batchGet(command);
    }

    if (command instanceof GetCommand) {
      return { Item: { AppName: 'release', ...rules('release', '0.5.2') } };
    }

    if (command instanceof QueryCommand) {
      const pk = command.input.ExpressionAttributeValues?.[':pk'];
      if (pk === 'applications') {
        return {
          Items: [
            { AppName: 'release', DisplayName: 'release' },
            { AppName: 'blog', DisplayName: 'blog' },
            { AppName: 'nextjs-demo', DisplayName: 'nextjs-demo' },
          ],
        };
      }

      const versions: Record<string, unknown[]> = {
        'appname#release': [version('release', '0.5.3'), version('release', '0.5.2')],
        'appname#blog': [version('blog', '1.0.0')],
        'appname#nextjs-demo': [
          version('nextjs-demo', '0.7.0'),
          version('nextjs-demo', '0.6.3'),
          version('nextjs-demo', '0.0.0-pr.21'),
        ],
      };
      return { Items: versions[pk as string] ?? [] };
    }

    throw new Error(`Unexpected command ${String(command)}`);
  });
}

describe('loadReleaseConsoleData', () => {
  beforeEach(() => {
    send.mockReset();
  });

  test('loads every app live version in one batch and flags newer releases', async () => {
    routeCommands();

    const data = await loadReleaseConsoleData('release');

    expect(data.apps).toEqual([
      { appName: 'blog', displayName: 'blog', liveVersion: '1.0.0', newerRelease: null },
      {
        appName: 'nextjs-demo',
        displayName: 'nextjs-demo',
        liveVersion: '0.6.3',
        newerRelease: '0.7.0',
      },
      { appName: 'release', displayName: 'release', liveVersion: '0.5.2', newerRelease: '0.5.3' },
    ]);
    expect(data.source).toMatchObject({ tableName: 'MicroApps' });

    const commands = send.mock.calls.map(([command]) => command);
    const batchGets = commands.filter((command) => command instanceof BatchGetCommand);
    expect(batchGets).toHaveLength(1);
    // The selected app's rules come from its own consistent read, not the batch.
    expect(batchGets[0]?.input.RequestItems?.[TableName]?.Keys).toEqual([
      { PK: 'appname#blog', SK: 'rules' },
      { PK: 'appname#nextjs-demo', SK: 'rules' },
    ]);
    const rulesGet = commands.find((command) => command instanceof GetCommand);
    expect(rulesGet?.input).toMatchObject({
      Key: { PK: 'appname#release', SK: 'rules' },
      ConsistentRead: true,
    });
    const summaryQuery = commands.find(
      (command) =>
        command instanceof QueryCommand &&
        command.input.ExpressionAttributeValues?.[':pk'] === 'appname#blog',
    );
    expect(summaryQuery?.input).toMatchObject({
      ProjectionExpression: 'SemVer, #status',
      ExpressionAttributeNames: { '#status': 'Status' },
    });
  });

  test('retries keys DynamoDB leaves unprocessed', async () => {
    const batchGet = vi
      .fn()
      .mockReturnValueOnce({
        Responses: { [TableName]: [rules('blog', '1.0.0')] },
        UnprocessedKeys: { [TableName]: { Keys: [{ PK: 'appname#nextjs-demo', SK: 'rules' }] } },
      })
      .mockReturnValueOnce({ Responses: { [TableName]: [rules('nextjs-demo', '0.6.3')] } });
    routeCommands({ batchGet });

    const data = await loadReleaseConsoleData('release');

    expect(batchGet).toHaveBeenCalledTimes(2);
    expect(data.apps.find((app) => app.appName === 'nextjs-demo')?.liveVersion).toBe('0.6.3');
  });

  test('still renders the selected app when the rail summaries fail', async () => {
    routeCommands({
      batchGet: () => {
        throw new Error('throttled');
      },
    });

    const data = await loadReleaseConsoleData('release');

    expect(data.loadError).toBeNull();
    expect(data.defaultVersion).toBe('0.5.2');
    expect(data.apps.find((app) => app.appName === 'blog')?.liveVersion).toBeNull();
    expect(data.apps.find((app) => app.appName === 'release')?.liveVersion).toBe('0.5.2');
  });
});
