// import next from 'next';
import NextServer from 'next/dist/server/next-server';
import express from 'express';
import { readFileSync } from 'fs';
import path from 'path';
import { createLogger } from './src/utils/logger';

const RequiredServerFiles = JSON.parse(
  readFileSync('./.next/required-server-files.json').toString('utf-8'),
);
const log = createLogger('server');
const port = parseInt(process.env.PORT, 10) || 3000;
const dev = !process.env.NODE_ENV.startsWith('prod');
// const app = new next({ dev });
const app = new NextServer({
  // Next.js compression should be disabled because of a bug
  // in the bundled `compression` package. See:
  // https://github.com/vercel/next.js/issues/11669
  conf: { ...RequiredServerFiles.config, compress: false },
  customServer: true,
  dev,
  dir: path.join(__dirname, '..', '..'),
  minimalMode: false,
});
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = express();

  server.all('*', (req, res) => {
    return handle(req, res);
  });

  server.listen(port, () => {
    log.info(`Ready on http://localhost:${port}`);
  });
});
