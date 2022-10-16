import express, { Express, RequestHandler } from 'express';
import nextJS from 'next';
import { json as bodyParserJson } from 'body-parser';

const app = nextJS({ dev: false });
const nextHandler: RequestHandler = app.getRequestHandler() as unknown as RequestHandler;

export const start = async ({ compression }: { compression?: () => RequestHandler } = {}): Promise<{
  expressApp: Express;
}> => {
  await app.prepare();
  const expressApp = express();

  if (compression) {
    expressApp.use(compression());
  }

  expressApp.use(bodyParserJson());

  expressApp.get('*', nextHandler);
  expressApp.post('*', nextHandler);
  expressApp.patch('*', nextHandler);
  expressApp.put('*', nextHandler);
  expressApp.delete('*', nextHandler);

  return {
    expressApp,
  };
};
