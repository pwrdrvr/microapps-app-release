// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { NextApiRequest, NextApiResponse } from 'next';
import { IPageState } from '../../store/main';
import { createLogger } from '../../utils/logger';

const testPayload: IPageState = {
  apps: [{ id: 'cat', AppName: 'client: cat', DisplayName: 'client: dog' }],
  versions: [
    {
      id: 'cat',
      AppName: 'client: cat',
      SemVer: '0.0.0',
      DefaultFile: 'index.html',
      Status: 'done?',
      IntegrationID: 'none',
      Type: 'next.js',
    },
  ],
  rules: {
    AppName: 'client: cat',
    RuleSet: [
      {
        id: 'client:default',
        key: 'client:default',
        AttributeName: '',
        AttributeValue: '',
        SemVer: '0.0.0',
      },
    ],
  },
};

export default async function refresh(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  const log = createLogger('api:refresh', req.url);

  try {
    res.statusCode = 200;
    res.json(testPayload);
    log.info(`returned static payload`);
  } catch (error) {
    log.error(error);
    res.statusCode = 500;
    res.json([]);
  }
}
