// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { NextApiRequest, NextApiResponse } from 'next';
import { createLogger } from '../../../utils/logger';
import { IRules, IVersion } from '../../../store/main';
import { DbManager } from '../../../utils/dbManager';
import Manager from '@pwrdrvr/microapps-datalib';

export default async function refresh(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  const log = createLogger('api:refresh', req.url);

  log.info('got request', { query: req.query });

  const appName = req.query.appName as string;

  try {
    const manager = DbManager.instance;

    // Get the versions
    const versionsRaw = await Manager.GetVersionsAndRules(appName);
    const versions = [] as IVersion[];
    for (const version of versionsRaw.Versions) {
      versions.push({
        AppName: version.AppName,
        SemVer: version.SemVer,
        Type: version.Type,
        Status: version.Status,
        //DefaultFile: version.DefaultFile,
        IntegrationID: version.IntegrationID,
      });
    }
    //log.info(`got versions`, versions);

    // Get the rules
    const rules = {} as IRules;
    rules.AppName = versionsRaw.Rules.AppName;
    rules.RuleSet = [];
    for (const key of Object.keys(versionsRaw.Rules.RuleSet)) {
      const rule = versionsRaw.Rules.RuleSet[key];
      rules.RuleSet.push({
        key,
        AttributeName: rule.AttributeName ?? '',
        AttributeValue: rule.AttributeValue ?? '',
        SemVer: rule.SemVer,
      });
    }
    //log.info(`got rules`, versions);

    res.statusCode = 200;
    res.json({ appName, versions, rules });
    log.info(`returned db payload`);
  } catch (error) {
    log.error(error);
    res.statusCode = 500;
    res.json([]);
  }
}
