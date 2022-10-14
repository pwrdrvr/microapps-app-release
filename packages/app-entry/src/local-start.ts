import { start } from './server';
import type { RequestHandler } from 'express';
import compression from 'compression';
import { readFileSync, existsSync } from 'fs';
import * as spdy from 'spdy';

const keyPath = existsSync('../../config/localhost.key')
  ? '../../config/localhost.key'
  : './config/localhost.key';
const crtPath = existsSync('../../config/localhost.crt')
  ? '../../config/localhost.crt'
  : './config/localhost.crt';

async function localStart() {
  const { expressApp } = await start({
    compression: compression as unknown as () => RequestHandler,
  });
  const server = spdy.createServer(
    {
      key: readFileSync(keyPath),
      cert: readFileSync(crtPath),
    },
    expressApp,
  );
  server.listen(3000);

  console.log(`> Ready on https://localhost:3000/release/0.0.0`);
}

localStart();
