// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { NextApiRequest, NextApiResponse } from 'next';
import { IApplication, IRules, IVersion } from '../../store/main';
import { createLogger } from '../../utils/logger';
import { Application } from '@pwrdrvr/microapps-datalib';
import { DbManager } from '../../utils/dbManager';

export default async function refresh(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  const log = createLogger('api:refresh', req.url);
  try {
    // Get the apps
    const appsRaw = await Application.LoadAllApps(DbManager.instance.manager);
    const apps = [] as IApplication[];
    for (const app of appsRaw) {
      apps.push({ AppName: app.AppName, DisplayName: app.DisplayName });
    }
    log.info(`got apps`, apps);

    // Get the versions
    const versionsRaw = await Application.GetVersionsAndRules({
      dbManager: DbManager.instance.manager,
      key: { AppName: 'release' },
    });
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
    res.json({ apps, versions, rules });
    log.info(`returned db payload`);
  } catch (error) {
    log.error(error);
    res.statusCode = 500;
    res.json([]);
  }
}
