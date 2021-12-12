// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { NextApiRequest, NextApiResponse } from 'next';
import { Application } from '@pwrdrvr/microapps-datalib';
import { createLogger } from '../../utils/logger';
import { DbManager } from '../../utils/dbManager';

interface IApplication {
  AppName: string;
  DisplayName: string;
}

export default async function allApps(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  const log = createLogger('api:allApps', req.url);

  try {
    const appsRaw = await Application.LoadAllApps(DbManager.instance.manager);

    const apps = [] as IApplication[];
    for (const app of appsRaw) {
      apps.push({ AppName: app.AppName, DisplayName: app.DisplayName });
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
