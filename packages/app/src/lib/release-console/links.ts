export function buildVersionPreviewUrl(appName: string, semVer: string) {
  const path = appName === '[root]' ? '/' : `/${encodeURIComponent(appName)}`;
  const params = new URLSearchParams({
    appver: semVer,
  });

  return `${path}?${params.toString()}`;
}

export function buildLambdaConsoleUrl(lambdaArn: string) {
  const match = /^arn:aws:lambda:([^:]+):[^:]+:function:(.+)$/.exec(lambdaArn);
  if (!match) {
    return null;
  }

  const [, region, functionName] = match;

  return `https://${region}.console.aws.amazon.com/lambda/home?region=${region}#/functions/${encodeURIComponent(
    functionName,
  )}?tab=monitoring`;
}
