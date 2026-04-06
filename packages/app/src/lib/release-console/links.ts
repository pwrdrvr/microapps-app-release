function buildAppPath(appName: string) {
  return appName === '[root]' ? '/' : `/${encodeURIComponent(appName)}`;
}

const releaseAppBasePath = '/release';
const releaseAppVersionPlaceholder = '0.0.0';
const releaseAssetVersionPattern = /\/release\/([^/]+)\/_next\/static\//;

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

function readReleaseAssetVersionFromDocument(doc: Document) {
  const assetElement = doc.querySelector<HTMLScriptElement | HTMLLinkElement>(
    'script[src*="/release/"][src*="/_next/static/"], link[href*="/release/"][href*="/_next/static/"]',
  );
  const assetUrl = assetElement?.getAttribute('src') ?? assetElement?.getAttribute('href') ?? '';
  const match = releaseAssetVersionPattern.exec(assetUrl);

  return match?.[1] ?? releaseAppVersionPlaceholder;
}

export function buildDefaultVersionApiUrl() {
  const releaseVersion =
    typeof document === 'undefined'
      ? releaseAppVersionPlaceholder
      : readReleaseAssetVersionFromDocument(document);

  return `${releaseAppBasePath}/${releaseVersion}/api/default-version`;
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
