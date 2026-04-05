import { appendFileSync } from 'node:fs';

import { parseReleaseTag } from './release-tag.mjs';

const metadata = parseReleaseTag(process.argv[2]);

if (process.env.GITHUB_OUTPUT) {
  appendGitHubOutput('version', metadata.version);
  appendGitHubOutput('isPrerelease', String(metadata.isPrerelease));
  appendGitHubOutput('releaseChannel', metadata.channel ?? 'stable');
  appendGitHubOutput('npmDistTag', metadata.npmDistTag);
}

process.stdout.write(`${JSON.stringify(metadata, null, 2)}\n`);

function appendGitHubOutput(name, value) {
  appendFileSync(process.env.GITHUB_OUTPUT, `${name}=${value}\n`);
}
