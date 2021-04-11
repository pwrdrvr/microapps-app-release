// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { NextApiRequest, NextApiResponse } from 'next';
import Manager, { Application } from '@pwrdrvr/microapps-datalib';
import * as dynamodb from '@aws-sdk/client-dynamodb';
import { createLogger } from '../../utils/logger';

let dbclient: dynamodb.DynamoDB;
let manager: Manager;

interface IApplication {
  AppName: string;
  DisplayName: string;
}

export default async function allApps(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  const log = createLogger('api:allApps', req.url);

  try {
    if (manager === undefined) {
      dbclient = new dynamodb.DynamoDB({});
      manager = new Manager(dbclient);
    }

    const appsRaw = await Application.LoadAllAppsAsync(dbclient);

    const apps = [] as IApplication[];
    for (const app of appsRaw) {
      apps.push({ AppName: 'client: ' + app.AppName, DisplayName: 'client: ' + app.DisplayName });
    }

    res.statusCode = 200;
    res.json(apps);

    log.info(`got all apps`);
  } catch (error) {
    log.error(error);
    res.statusCode = 500;
    res.json([]);
  }
}
