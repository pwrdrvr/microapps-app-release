// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { NextApiRequest, NextApiResponse } from 'next';
import { createLogger } from '../../../../../utils/logger';
import { Application } from '@pwrdrvr/microapps-datalib';
import { DbManager } from '../../../../../utils/dbManager';

export default async function refresh(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  const log = createLogger('api:refresh', req.url);

  log.info('got request', { query: req.query });

  const appName = req.query.appName as string;
  const semVer = req.query.semVer as string;

  try {
    await Application.UpdateDefaultRule({
      dbManager: DbManager.instance.manager,
      key: { AppName: appName, SemVer: semVer },
    });

    res.statusCode = 200;
    res.send({ action: 'updated', appName, semVer });
    log.info(`updated default version of ${appName} to ${semVer}`);
  } catch (error) {
    log.error(error);
    res.statusCode = 500;
    res.json([]);
  }
}
