import 'source-map-support/register';
import { start } from './server.cjs';
import { log } from './utils/log.js';
import * as serverlessExpress from '@vendia/serverless-express';
import type * as lambda from 'aws-lambda';
import * as xray from 'aws-xray-sdk-core';
// https://docs.aws.amazon.com/xray/latest/devguide/xray-sdk-nodejs-httpclients.html
// https://github.com/aws/aws-xray-sdk-node/issues/214#issuecomment-554015189
import http, { RequestListener } from 'http';
import https from 'https';

const { captureHTTPsGlobal, capturePromise, getSegment } = xray;
captureHTTPsGlobal(http);
captureHTTPsGlobal(https);
// Might be needed for Axios capture?
capturePromise();

// Enable HTTP keep-alive on all outbound HTTP requests
const keepAliveOptions = {
  keepAlive: true,
};
http.globalAgent = new http.Agent(keepAliveOptions);
https.globalAgent = new https.Agent(keepAliveOptions);

process.on('uncaughtException', (error) => {
  log.error('uncaughtException', { err: error });
});
process.on('unhandledRejection', (error) => {
  if (error !== undefined && error !== null && typeof error === 'object') {
    log.error('unhandledRejection', { err: error });
  } else {
    log.error('unhandledRejection');
  }
});

let initRequestSent = false;

/**
 * Optional warm-up request to get module files, translations, etc. loaded
 *
 * Helps a lot with provisioned concurrency but not with on-demand
 *
 * @param expressHandler
 * @returns
 */
async function sendInitRequest(expressHandler: ReturnType<typeof serverlessExpress.configure>) {
  if (initRequestSent) {
    log.info('sendInitRequest - already sent, returning');
    return;
  }

  initRequestSent = true;

  log.info('sendInitRequest - starting');

  const initRequest: lambda.APIGatewayProxyEventV2 = {
    version: '2.0',
    routeKey: '$default',
    headers: {},
    cookies: ['forceapp=ecomm'],
    isBase64Encoded: false,
    rawPath: '/release/0.0.0',
    rawQueryString: 'some=value',
    pathParameters: {},
    queryStringParameters: {
      some: 'value',
    },
    requestContext: {
      accountId: '123456789012',
      apiId: 'abc123def456',
      domainName: 'init',
      domainPrefix: 'init',
      requestId: 'c6af9ac6-7b61-11e6-9a41-93e8deadbeef',
      stage: 'test',
      routeKey: '$default',
      time: '2016-09-19T12:34:56.789Z',
      timeEpoch: 1472629767089,
      http: {
        method: 'GET',
        path: '/release/0.0.0',
        protocol: 'https',
        sourceIp: '127.0.0.1',
        userAgent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36',
      },
    },
  };

  const initResponse = (await expressHandler(initRequest, {} as lambda.Context, () => {
    log.info('init callback called');
  })) as lambda.APIGatewayProxyStructuredResultV2;

  log.info('sendInitRequest - done');

  return initResponse;
}

let _expressHandler: ReturnType<typeof serverlessExpress.configure> | undefined = undefined;

/**
 * Initialize the provisioned lambdas before they are put into the pool to serve requests
 *
 * This avoids waiting for the init time on first request
 */
async function doSomeAsyncInit(): Promise<{
  expressHandler: ReturnType<typeof serverlessExpress.configure>;
  theApp?: RequestListener;
}> {
  const startTime = Date.now();
  let subTime = Date.now();
  const segment = getSegment();
  const subSegment = segment?.addNewSubsegment('doSomeAsyncInit');

  log.fields.initType = process.env.AWS_LAMBDA_INITIALIZATION_TYPE;

  try {
    if (_expressHandler) {
      log.info('doSomeAsyncInit - already initialized - returning');
      return { expressHandler: _expressHandler };
    }

    log.info('doSomeAsyncInit - starting');

    subTime = Date.now();
    const theApp = (await start()).expressApp;
    log.info(`TIMING: doSomeAsyncInit - express loaded: ${Date.now() - subTime} ms`);

    try {
      _expressHandler = serverlessExpress.configure({ app: theApp });

      // Do an init request only if this is a pre-provisioned instance that
      // does not already have a request associated with it
      // https://docs.aws.amazon.com/lambda/latest/dg/configuration-envvars.html
      if (process.env.AWS_LAMBDA_INITIALIZATION_TYPE === 'provisioned-concurrency') {
        log.info(
          `doSomeAsyncInit - init request - performing for init type: ${process.env.AWS_LAMBDA_INITIALIZATION_TYPE}`,
        );
        subTime = Date.now();
        await sendInitRequest(_expressHandler);
        log.info(`TIMING: doSomeAsyncInit - init request finished: ${Date.now() - subTime} ms`);
      } else {
        log.info(
          `doSomeAsyncInit - init request - skipping for init type: ${process.env.AWS_LAMBDA_INITIALIZATION_TYPE}`,
        );
      }
    } catch (error) {
      log.error('caught exception during serverlessExpress.configure', { err: error });
      throw error;
    }

    log.info(`doSomeAsyncInit - done: ${Date.now() - startTime}`);

    return { expressHandler: _expressHandler, theApp };
  } finally {
    subSegment?.close();
    delete log.fields.initType;
  }
}

/**
 * Lambda entrypoint for Express Next.js wrapper
 *
 * @param event
 * @param context
 * @param callback
 * @returns
 */
export const handler = async (
  event: lambda.APIGatewayProxyEventV2,
  context: lambda.Context,
  callback: lambda.APIGatewayProxyCallbackV2,
): Promise<lambda.APIGatewayProxyStructuredResultV2 | undefined> => {
  delete log.fields.initType;

  if (event.headers['x-amz-security-token']) {
    delete event.headers['x-amz-security-token'];
  }
  if (event.headers['x-amz-content-sha256']) {
    delete event.headers['x-amz-content-sha256'];
  }
  if (event.headers['x-amz-date']) {
    delete event.headers['x-amz-date'];
  }

  // For capturing init details in Insights and XRay
  // Useful for figuring out why init is slow.
  if (!_expressHandler) {
    log.info('calling doSomeAsyncInit within handler');
    _expressHandler = (await doSomeAsyncInit()).expressHandler;
  }

  log.fields.awsRequestId = context.awsRequestId;
  log.fields.rawPath = event.rawPath;

  const segment = getSegment();
  const subSegment = segment?.addNewSubsegment('RequestInfo');

  if (event.headers['x-log-request']) {
    log.info('received message', {
      event,
    });
  }

  try {
    // Validate the incoming JSON
    if (event === undefined) {
      // Bail out
      throw new Error('payload was undefined');
    }

    // Replace the host header with the x-forwarded-host header that
    // CloudFront passes through from our configured value
    if (event.headers) {
      if (event.headers['x-forwarded-host']) {
        event.headers.host = event.headers['x-forwarded-host'];
        event.requestContext.domainName = event.headers['x-forwarded-host'];
      }
    }

    const result = (await _expressHandler(
      event,
      context,
      callback as lambda.Callback,
    )) as lambda.APIGatewayProxyStructuredResultV2;

    if (!event.rawPath.startsWith('/_next/static/') && !event.rawPath.startsWith('/static/')) {
      log.info('result from handler', {
        resultSize: result.body?.length,
        resultStatusCode: result.statusCode,
        resultIsBase64Encoded: result.isBase64Encoded,
      });
    }

    return result;
  } catch (error) {
    log.error('caught exception', error);

    return {
      isBase64Encoded: false,
      statusCode: 500,
    };
  } finally {
    subSegment?.close();
  }
};
