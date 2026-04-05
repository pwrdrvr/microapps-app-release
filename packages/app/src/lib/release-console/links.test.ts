import { describe, expect, test } from 'vitest';
import {
  buildAppOpenUrl,
  buildDefaultVersionApiUrl,
  buildLambdaConsoleUrl,
  buildVersionPreviewUrl,
} from './links';

describe('release console links', () => {
  test('builds an app URL for standard apps', () => {
    expect(buildAppOpenUrl('release')).toBe('/release');
  });

  test('builds an app URL for the root app', () => {
    expect(buildAppOpenUrl('[root]')).toBe('/');
  });

  test('builds a preview URL for standard apps', () => {
    expect(buildVersionPreviewUrl('release', '0.5.2')).toBe('/release?appver=0.5.2');
  });

  test('builds a preview URL for the root app', () => {
    expect(buildVersionPreviewUrl('[root]', '1.2.3')).toBe('/?appver=1.2.3');
  });

  test('builds the versioned default-version API URL', () => {
    expect(buildDefaultVersionApiUrl()).toBe('/release/0.0.0/api/default-version');
  });

  test('builds an AWS Console URL from a Lambda ARN', () => {
    expect(
      buildLambdaConsoleUrl('arn:aws:lambda:us-east-2:123456789012:function:release-prod-pr-106'),
    ).toBe(
      'https://us-east-2.console.aws.amazon.com/lambda/home?region=us-east-2#/functions/release-prod-pr-106?tab=monitoring',
    );
  });

  test('preserves Lambda qualifiers in the AWS Console URL', () => {
    expect(
      buildLambdaConsoleUrl(
        'arn:aws:lambda:us-east-2:123456789012:function:microapps-core-ghpublic-app-release-prod:v0_5_2',
      ),
    ).toBe(
      'https://us-east-2.console.aws.amazon.com/lambda/home?region=us-east-2#/functions/microapps-core-ghpublic-app-release-prod:v0_5_2?tab=monitoring',
    );
  });

  test('returns null for a malformed Lambda ARN', () => {
    expect(buildLambdaConsoleUrl('not-an-arn')).toBeNull();
  });
});
