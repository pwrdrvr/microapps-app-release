// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { NextApiRequest, NextApiResponse } from 'next';
import { createLogger } from '../../../../../utils/logger';
import Manager from '@pwrdrvr/microapps-datalib';
import * as dynamodb from '@aws-sdk/client-dynamodb';

let dbclient: dynamodb.DynamoDB;
let manager: Manager;

export default async function refresh(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  const log = createLogger('api:refresh', req.url);

  log.info('got request', { query: req.query });

  const appName = req.query.appName as string;
  const semVer = req.query.semVer as string;

  try {
    if (manager === undefined) {
      dbclient = new dynamodb.DynamoDB({});
      manager = new Manager(dbclient);
    }

    await Manager.UpdateDefaultRule(appName, semVer);

    res.statusCode = 200;
    res.send({ action: 'updated', appName, semVer });
    log.info(`updated default version of ${appName} to ${semVer}`);
  } catch (error) {
    log.error(error);
    res.statusCode = 500;
    res.json([]);
  }
}
