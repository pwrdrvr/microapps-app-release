// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { ApplicationClient } from '../../clients/DeployerClient';
import fetch from 'node-fetch';

export default async function hello(req, res): Promise<void> {
  const client = new ApplicationClient(undefined, { fetch });

  res.statusCode = 200;
  res.json(await client.get());
}
