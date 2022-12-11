const { start } = require('./server.cjs');
const compression = require('compression');
const fs = require('fs');
const spdy = require('spdy');

const keyPath = fs.existsSync('../../config/localhost.key')
  ? '../../config/localhost.key'
  : './config/localhost.key';
const crtPath = fs.existsSync('../../config/localhost.crt')
  ? '../../config/localhost.crt'
  : './config/localhost.crt';

async function localStart() {
  const { expressApp } = await start({ compression });
  const server = spdy.createServer(
    {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(crtPath),
    },
    expressApp,
  );
  server.listen(3000);

  console.log(`> Ready on https://localhost:3000/release/0.0.0`);
}

localStart();
