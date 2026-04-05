function buildAppPath(appName: string) {
  return appName === '[root]' ? '/' : `/${encodeURIComponent(appName)}`;
}

const releaseAppBasePath = '/release';
const releaseAppVersionPlaceholder = '0.0.0';

export function buildAppOpenUrl(appName: string) {
  return buildAppPath(appName);
}

export function buildVersionPreviewUrl(appName: string, semVer: string) {
  const path = buildAppPath(appName);
  const params = new URLSearchParams({
    appver: semVer,
  });

  return `${path}?${params.toString()}`;
}

export function buildDefaultVersionApiUrl() {
  return `${releaseAppBasePath}/${releaseAppVersionPlaceholder}/api/default-version`;
}

export function buildLambdaConsoleUrl(lambdaArn: string) {
  const match = /^arn:aws:lambda:([^:]+):[^:]+:function:(.+)$/.exec(lambdaArn);
  if (!match) {
    return null;
  }

  const [, region, functionName] = match;
  const consoleFunctionName = encodeURIComponent(functionName).replaceAll('%3A', ':');

  return `https://${region}.console.aws.amazon.com/lambda/home?region=${region}#/functions/${consoleFunctionName}?tab=monitoring`;
}
