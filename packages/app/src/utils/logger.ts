import { LambdaLog, LogMessage } from 'lambda-log';

const localTesting = process.env.DEBUG ? true : false;

export function createLogger(source: string, url?: string): LambdaLog {
  return new LambdaLog({
    dev: localTesting,
    //debug: localTesting,
    meta: { source, url },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    dynamicMeta: (_message: LogMessage) => {
      return {
        timestamp: new Date().toISOString(),
      };
    },
  });
}
