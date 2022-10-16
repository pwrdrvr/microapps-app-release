const express = require('express');
const nextJS = require('next');
const bodyParser = require('body-parser');

const app = nextJS({ dev: false });
const nextHandler = app.getRequestHandler();

const start = async ({ compression } = {}) => {
  await app.prepare();
  const expressApp = express();

  if (compression) {
    expressApp.use(compression());
  }

  expressApp.use(bodyParser.json());

  expressApp.get('*', nextHandler);
  expressApp.post('*', nextHandler);
  expressApp.patch('*', nextHandler);
  expressApp.put('*', nextHandler);
  expressApp.delete('*', nextHandler);

  return {
    expressApp,
  };
};

exports.start = start;
