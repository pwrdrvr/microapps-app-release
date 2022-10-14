const { start } = require('./server.cjs');
const compression = require('compression');
const fs = require('fs');
const spdy = require('spdy');

async function localStart() {
  const { expressApp } = await start({ compression });
  const server = spdy.createServer(
    {
      key: fs.readFileSync('./config/localhost.key'),
      cert: fs.readFileSync('./config/localhost.crt'),
    },
    expressApp,
  );
  server.listen(3000);

  console.log(`> Ready on https://localhost:3000/release/0.0.0`);
}

localStart();
