#!/usr/bin/env node
// Re-applies the `minimumReleaseAge` cooldown from `pnpm-workspace.yaml` to
// every version already pinned in `pnpm-lock.yaml`.
//
// Ported from PwrGit/scripts/check-dependency-maturity.mjs. Adapted for this
// repo: the exported checks are the same, the CLI entrypoint guard is inlined
// (PwrGit keeps it in scripts/lib/), the cache path is namespaced to this repo,
// and the tests are rewritten for `node --test` because that is what
// `pnpm test:repo-tools` runs here.
//
// ── Why this exists ─────────────────────────────────────────────────────────
//
// pnpm only consults `minimumReleaseAge` while it *resolves*, and nothing in
// this repo's CI resolves. Every workflow installs through
// `pwrdrvr/configure-nodejs`, which runs `pnpm install --frozen-lockfile
// --store-dir .pnpm-store`; that prints "Lockfile is up to date, resolution
// step is skipped" and installs exactly what the lockfile says. So the setting
// in pnpm-workspace.yaml, on its own, is enforced on whichever contributor
// happens to run a resolving install and on no CI job at all — which is the
// same drift PwrGit hit, where a dependency merged one day after publication
// went green through every check and then failed a release a week later.
//
// This check moves the gate to where the dependency actually lands: it reads
// the versions the lockfile pins, asks the registry when each was published,
// and fails if any is younger than the window. Run it from `pnpm lint` (so a
// Dependabot PR fails on the PR itself) — see `pnpm deps:maturity`.
//
// ── Exclusion syntax ────────────────────────────────────────────────────────
//
// `minimumReleaseAgeExclude` entries are matched as:
//
//   name              every version of that package
//   @scope/*          every package under that scope (trailing `*` wildcard)
//   name@1.2.3        exactly that release
//   name@1.2.3 || 1.2.4
//                     exactly those releases
//
// pnpm itself also accepts semver ranges after the `@`. This audit rejects them
// rather than guessing: an allowlist entry that silently covers more releases
// than its author intended is the failure mode worth designing against, and
// `pnpm deps:maturity` names the exact version to pin.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const REGISTRY = 'https://registry.npmjs.org';
const CACHE_PATH = join(
  repoRoot,
  'node_modules',
  '.cache',
  'microapps-app-release',
  'dependency-publish-times.json',
);
const FETCH_CONCURRENCY = 16;
// A cold run asks the registry about every distinct package name in the
// lockfile — around 900 here — and CI is always cold. Treating one transient 5xx
// out of 900 as fatal would fail lint on a large fraction of runs, so each
// request retries with backoff, and none may hang forever.
const FETCH_ATTEMPTS = 3;
const FETCH_TIMEOUT_MS = 30_000;
const FETCH_RETRY_BASE_MS = 250;
// Retries are for the odd blip in a large batch. Once this many packages have
// exhausted theirs, the registry is not flaky, it is unreachable — stop paying
// backoff for the remaining hundreds and report the outage promptly.
const FAIL_FAST_AFTER = 10;

// `1.2.3`, `1.2.3-rc.1`, `1.2.3+build`. Anything else in a `packages:` key is a
// link:/file:/tarball resolution, which has no registry publish time and no
// cooldown to enforce.
const REGISTRY_VERSION = /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)*$/;

/**
 * Read `minimumReleaseAge` and `minimumReleaseAgeExclude` out of
 * `pnpm-workspace.yaml`.
 *
 * Hand-parsed on purpose: no YAML library is a root dependency, and the two
 * settings are a scalar and a flat list of strings. Comments and blank lines may
 * be interleaved anywhere, including inside the list.
 */
export function parseMaturityPolicy(yaml) {
  let minimumReleaseAgeMinutes;
  const exclusions = [];
  let inExclusions = false;

  for (const raw of yaml.split('\n')) {
    const line = raw.replace(/\r$/, '');
    if (line.trim() === '' || line.trimStart().startsWith('#')) continue;

    if (inExclusions) {
      const item = /^\s+-\s+(.*)$/.exec(line);
      if (item) {
        exclusions.push(unquote(item[1].replace(/\s+#.*$/, '').trim()));
        continue;
      }
      inExclusions = false;
    }

    // `minimumReleaseAgeExclude: []` is the empty list written inline; there is
    // no block to enter and nothing to collect.
    if (/^minimumReleaseAgeExclude:\s*\[\s*\]\s*(?:#.*)?$/.test(line)) continue;

    if (/^minimumReleaseAgeExclude:\s*(?:#.*)?$/.test(line)) {
      inExclusions = true;
      continue;
    }

    const age = /^minimumReleaseAge:\s*([0-9_]+)\s*(?:#.*)?$/.exec(line);
    if (age) minimumReleaseAgeMinutes = Number(age[1].replaceAll('_', ''));
  }

  return { minimumReleaseAgeMinutes, exclusions };
}

/**
 * Every registry package pinned by the lockfile, as `{ name, version }`.
 *
 * Only the top-level `packages:` block is read. `snapshots:` repeats the same
 * releases with peer-dependency suffixes
 * (`eslint-plugin-import@2.26.0(eslint@7.32.0)`) and would double-count them.
 */
export function parseLockedPackages(yaml) {
  const packages = [];
  const seen = new Set();
  let inPackages = false;

  for (const raw of yaml.split('\n')) {
    const line = raw.replace(/\r$/, '');
    if (/^packages:\s*$/.test(line)) {
      inPackages = true;
      continue;
    }
    if (!inPackages) continue;
    // Any other column-0 key ends the block.
    if (/^\S/.test(line)) break;

    const entry = /^ {2}(\S.*?):\s*$/.exec(line);
    if (!entry) continue;

    const key = unquote(entry[1]);
    const at = key.lastIndexOf('@');
    if (at <= 0) continue;

    const name = key.slice(0, at);
    const version = key.slice(at + 1);
    if (!REGISTRY_VERSION.test(version)) continue;

    const id = `${name}@${version}`;
    if (seen.has(id)) continue;
    seen.add(id);
    packages.push({ name, version });
  }

  return packages;
}

/**
 * Split `minimumReleaseAgeExclude` entries into matchers, rejecting the
 * semver-range forms this audit will not evaluate.
 */
export function parseExclusions(exclusions) {
  const matchers = [];
  const unsupported = [];

  for (const entry of exclusions) {
    const at = entry.lastIndexOf('@');
    const hasVersion = at > 0;
    const name = hasVersion ? entry.slice(0, at) : entry;
    const spec = hasVersion ? entry.slice(at + 1).trim() : undefined;

    if (spec === undefined) {
      matchers.push({ entry, name, versions: undefined });
      continue;
    }

    const versions = spec.split('||').map((part) => part.trim());
    if (versions.some((version) => !REGISTRY_VERSION.test(version))) {
      unsupported.push(entry);
      continue;
    }
    matchers.push({ entry, name, versions });
  }

  return { matchers, unsupported };
}

function nameMatches(pattern, name) {
  if (pattern === name) return true;
  return pattern.endsWith('*') && name.startsWith(pattern.slice(0, -1));
}

/** Whether one matcher covers `name@version`. */
export function matcherCovers(matcher, name, version) {
  return (
    nameMatches(matcher.name, name) &&
    (matcher.versions === undefined || matcher.versions.includes(version))
  );
}

/** The matcher covering `name@version`, or undefined when none does. */
export function findExclusion(name, version, matchers) {
  return matchers.find((matcher) => matcherCovers(matcher, name, version));
}

/**
 * The audit itself, over publish times someone else fetched.
 *
 * `publishedAt` maps `name@version` to an ISO-8601 publish time.
 */
export function auditDependencyMaturity({
  packages,
  publishedAt,
  matchers,
  minimumReleaseAgeMinutes,
  now,
}) {
  const windowMs = minimumReleaseAgeMinutes * 60_000;
  const immature = [];
  const unverifiable = [];
  const excludedIds = new Set();
  const maturedUnderPin = new Map();

  for (const { name, version } of packages) {
    const id = `${name}@${version}`;
    const exclusion = findExclusion(name, version, matchers);
    const published = publishedAt.get(id);

    if (published === undefined) {
      // An excluded release is allowed through whatever its age, so a missing
      // publish time for one is not a hole in the gate.
      if (exclusion === undefined) unverifiable.push(id);
      else excludedIds.add(id);
      continue;
    }

    const ageMs = now - Date.parse(published);
    const matured = ageMs >= windowMs;

    if (exclusion !== undefined) {
      excludedIds.add(id);
      // A pinned exemption that has served its purpose. Reported, never fatal:
      // the release it unblocked is already in, and failing the build over
      // housekeeping would just teach people to widen the entry instead.
      if (matured && exclusion.versions !== undefined) {
        maturedUnderPin.set(exclusion.entry, [
          ...(maturedUnderPin.get(exclusion.entry) ?? []),
          id,
        ]);
      }
      continue;
    }

    if (!matured) {
      immature.push({
        name,
        version,
        published,
        ageMs,
        maturesAt: Date.parse(published) + windowMs,
      });
    }
  }

  // A pin nothing resolves any more is equally prunable. Bare names and scope
  // wildcards are standing policy rather than a one-release waiver, so they are
  // never reported.
  const stale = [];
  for (const matcher of matchers) {
    const { entry, versions } = matcher;
    if (versions === undefined) continue;
    if (!packages.some(({ name, version }) => matcherCovers(matcher, name, version))) {
      stale.push({ entry, reason: 'nothing in the lockfile resolves it' });
      continue;
    }
    const matured = maturedUnderPin.get(entry);
    if (matured !== undefined) {
      stale.push({ entry, reason: `${matured.join(', ')} has matured past the window` });
    }
  }

  return { immature, unverifiable, stale, excludedCount: excludedIds.size };
}

function unquote(value) {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith("'") && trimmed.endsWith("'")) ||
    (trimmed.startsWith('"') && trimmed.endsWith('"'))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function readCache() {
  try {
    return new Map(Object.entries(JSON.parse(readFileSync(CACHE_PATH, 'utf8'))));
  } catch {
    return new Map();
  }
}

// Publish times are immutable, so a hit never has to be revalidated and the
// cache never has to expire. Only releases the lockfile has newly picked up cost
// a request — which is exactly the set a PR needs judged.
function writeCache(publishedAt, keep) {
  try {
    const kept = {};
    for (const id of keep) {
      const published = publishedAt.get(id);
      if (published !== undefined) kept[id] = published;
    }
    mkdirSync(dirname(CACHE_PATH), { recursive: true });
    writeFileSync(CACHE_PATH, `${JSON.stringify(kept)}\n`);
  } catch {
    // A cache we cannot write is a slower check, not a failed one.
  }
}

const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

/**
 * Fetch one packument, retrying the failures that are worth retrying.
 *
 * 5xx, 429 and transport errors are transient; 404 and the other 4xx are the
 * registry's final answer and retrying them only makes the whole check slower.
 */
async function fetchPackument(name, attempts) {
  let lastFailure;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      // The `time` map lives only in the full packument; the abbreviated
      // (`application/vnd.npm.install-v1+json`) and single-version documents
      // both omit it.
      const response = await fetch(`${REGISTRY}/${name.replace('/', '%2F')}`, {
        headers: { accept: 'application/json' },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
      if (response.ok) return { times: (await response.json()).time ?? {} };

      lastFailure = `registry responded ${response.status}`;
      if (response.status < 500 && response.status !== 429) break;
    } catch (error) {
      lastFailure = error.message;
    }
    if (attempt < attempts) await sleep(FETCH_RETRY_BASE_MS * 2 ** (attempt - 1));
  }

  return { failure: `${name}: ${lastFailure}` };
}

/**
 * Resolve publish times for `names`, keeping only the ids in `wanted`.
 *
 * A packument carries the package's whole publish history, and the audit reads
 * exactly the releases the lockfile pins, so the rest is dropped on arrival
 * rather than retained for the life of the process.
 */
async function fetchPublishTimes(names, wanted, publishedAt) {
  const queue = [...names];
  const failures = [];

  async function worker() {
    for (let name = queue.pop(); name !== undefined; name = queue.pop()) {
      const { times, failure } = await fetchPackument(
        name,
        failures.length < FAIL_FAST_AFTER ? FETCH_ATTEMPTS : 1,
      );
      if (failure !== undefined) {
        failures.push(failure);
        continue;
      }
      for (const [version, published] of Object.entries(times)) {
        const id = `${name}@${version}`;
        if (wanted.has(id)) publishedAt.set(id, published);
      }
    }
  }

  await Promise.all(Array.from({ length: FETCH_CONCURRENCY }, worker));
  return failures;
}

function fail(lines) {
  console.error(['[check-dependency-maturity]', ...lines].join('\n'));
  process.exit(1);
}

function days(ms) {
  return (ms / 86_400_000).toFixed(1);
}

// A publish timestamp ahead of the local clock (skew, or a release seconds old)
// would otherwise render as "-0.0 days ago" and read as a bug in the checker.
function age(ms) {
  return ms < 0 ? "just now, ahead of this machine's clock" : `${days(ms)} days ago`;
}

async function runCli() {
  const { minimumReleaseAgeMinutes, exclusions } = parseMaturityPolicy(
    readFileSync(join(repoRoot, 'pnpm-workspace.yaml'), 'utf8'),
  );

  // The drift this guards against: an exclusion list sitting under no gate, so
  // the only cooldown in force is whatever each developer's own pnpm config
  // happens to set — enforced on one machine, absent from CI.
  if (minimumReleaseAgeMinutes === undefined) {
    fail([
      'pnpm-workspace.yaml sets no `minimumReleaseAge`.',
      exclusions.length > 0
        ? `It does list ${exclusions.length} minimumReleaseAgeExclude entries, which exempt releases from a gate the repo never declares.`
        : 'Declare the cooldown here so every machine and CI job enforces the same policy.',
      'Add: minimumReleaseAge: 10080   # 7 days',
    ]);
  }

  const { matchers, unsupported } = parseExclusions(exclusions);
  if (unsupported.length > 0) {
    fail([
      'minimumReleaseAgeExclude entries must pin exact versions, not ranges:',
      ...unsupported.map((entry) => `  - ${entry}`),
      'Write `name`, `@scope/*`, `name@1.2.3`, or `name@1.2.3 || 1.2.4`.',
    ]);
  }

  const packages = parseLockedPackages(readFileSync(join(repoRoot, 'pnpm-lock.yaml'), 'utf8'));
  if (packages.length === 0) {
    fail(['pnpm-lock.yaml listed no registry packages — the lockfile format may have changed.']);
  }

  const lockedIds = new Set(packages.map(({ name, version }) => `${name}@${version}`));
  const publishedAt = readCache();
  const missing = new Set();
  for (const { name, version } of packages) {
    if (!publishedAt.has(`${name}@${version}`)) missing.add(name);
  }

  if (missing.size > 0) {
    const failures = await fetchPublishTimes(missing, lockedIds, publishedAt);
    // Written before the failure check: a cold run costs hundreds of packument
    // fetches, and one package the registry would not serve is no reason to
    // throw away the rest and pay for them again on the next attempt.
    writeCache(publishedAt, lockedIds);
    if (failures.length > 0) {
      fail([
        `could not read publish times for ${failures.length} package(s) from ${REGISTRY}:`,
        ...failures.slice(0, 10).map((failure) => `  ${failure}`),
        failures.length > FAIL_FAST_AFTER
          ? `The registry looks unreachable, so only the first ${FAIL_FAST_AFTER} were retried.`
          : `Each was retried up to ${FETCH_ATTEMPTS} times.`,
        'The cooldown cannot be verified offline for releases this checkout has not seen before.',
      ]);
    }
  }

  const result = auditDependencyMaturity({
    packages,
    publishedAt,
    matchers,
    minimumReleaseAgeMinutes,
    now: Date.now(),
  });

  if (result.unverifiable.length > 0) {
    fail([
      'the registry reports no publish time for:',
      ...result.unverifiable.map((id) => `  ${id}`),
    ]);
  }

  if (result.immature.length > 0) {
    const window = days(minimumReleaseAgeMinutes * 60_000);
    fail([
      `${result.immature.length} dependency version(s) are younger than the ${window}-day minimumReleaseAge:`,
      ...result.immature.map(
        ({ name, version, published, ageMs, maturesAt }) =>
          `  ${name}@${version} — published ${published} (${age(ageMs)}), matures ${new Date(maturesAt).toISOString()}`,
      ),
      '',
      '`pnpm install --frozen-lockfile` will not notice this: CI skips resolution',
      'entirely, so the cooldown in pnpm-workspace.yaml never runs there.',
      '',
      'Either wait for the window to pass and re-run the lockfile update, or — if',
      'the release has been reviewed and is worth taking early — pin it in',
      'pnpm-workspace.yaml with a comment saying why:',
      '',
      'minimumReleaseAgeExclude:',
      ...result.immature.map(({ name, version }) => `  - "${name}@${version}"`),
    ]);
  }

  const summary =
    `${packages.length} locked package versions checked against a ` +
    `${days(minimumReleaseAgeMinutes * 60_000)}-day cooldown` +
    (result.excludedCount > 0 ? `, ${result.excludedCount} excluded` : '');
  console.log(`[check-dependency-maturity] ok — ${summary}.`);

  for (const { entry, reason } of result.stale) {
    console.log(
      `[check-dependency-maturity] note: minimumReleaseAgeExclude "${entry}" is prunable — ${reason}.`,
    );
  }
}

// True when this module is what Node was asked to run. Comparing two file URLs
// keeps it indifferent to the separator and drive-letter casing Windows puts in
// `process.argv[1]`; that value is undefined under `--eval` and the REPL, which
// are not entrypoints for anything here.
const isCliEntrypoint =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isCliEntrypoint) {
  await runCli();
}
