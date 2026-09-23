# Overview

# Table of Contents <!-- omit in toc -->

- [Overview](#overview)
- [Developer Notes](#developer-notes)
  - [Repo Setup](#repo-setup)
  - [Dependency Policy](#dependency-policy)
  - [Trying out `esbuild` on `server.js`](#trying-out-esbuild-on-serverjs)
  - [Debugging the Next.js App](#debugging-the-nextjs-app)
  - [nextjs-redux-wrapper](#nextjs-redux-wrapper)
  - [Adding Storybook to Existing NPM React / Next Project](#adding-storybook-to-existing-npm-react--next-project)
- [Errors During `pnpm build` Locally](#errors-during-pnpm-build-locally)
# Developer Notes

## Repo Setup

This repo now uses `pnpm` for workspace development.

```sh
corepack enable pnpm
pnpm install
```

## Dependency Policy

Four controls, all enforced by committed files rather than by anyone's personal
setup. They exist to protect the machines that run `pnpm install` — contributor
laptops and the GitHub Actions runner — not to vet what ships to users.

**No git-sourced dependencies, ever.** `.pnpmfile.cjs` refuses any spec pnpm
would resolve over git: `git+https://`, `git@`, `ssh://git@`, the
`github:` / `gitlab:` / `bitbucket:` shortcuts, and the bare `user/repo` form.
A git spec carries no registry integrity hash, can be repointed after review by
a force-push, and fetching one runs its lifecycle scripts. The block applies to
`dependencies`, `optionalDependencies` and `peerDependencies` on every package
in the tree, and additionally to `devDependencies` on this repo's own packages —
ours install, run scripts, and are importable at build and test time.

It is not applied to transitive `devDependencies`, which pnpm never installs.
Doing so breaks real trees: `time-require@github:jonschlinkert/time-require` is
a devDependency of picomatch, micromatch and enquirer, and it never reaches
`pnpm-lock.yaml`.

If you keep a personal `~/.pnpm/global_pnpmfile.cjs`, `.npmrc` here sets
`global-pnpmfile=` so it does not apply in this repo. That is deliberate: it
keeps the lockfile's `pnpmfileChecksum` covering exactly one file, so
`pnpm install --frozen-lockfile` behaves the same for everyone. You are not
losing protection — the committed hook does the same job, and being in the
lockfile makes it tamper-evident.

**Editing `.pnpmfile.cjs` requires regenerating the lockfile.** The checksum is
part of `pnpm-lock.yaml`; if it does not match, every `--frozen-lockfile`
install fails with `ERR_PNPM_LOCKFILE_CONFIG_MISMATCH`. Run
`pnpm install --lockfile-only` and commit the result. `pnpm deps:sources`
verifies this, along with auditing the lockfile for git resolutions.

**A seven-day cooldown on new releases.** `minimumReleaseAge` in
`pnpm-workspace.yaml` refuses to resolve anything published less than a week
ago, so a compromised publish has time to be caught. pnpm only applies it while
resolving, and CI never resolves, so `pnpm deps:maturity` re-applies the same
window to the versions the lockfile already pins. To take a release early,
review it and add a `name@version` entry to `minimumReleaseAgeExclude` with a
comment saying why; `pnpm deps:maturity` tells you when the entry is prunable.

**No dependency build scripts.** `onlyBuiltDependencies` is empty, so nothing in
`node_modules` runs code at install time. The packages pnpm is currently
blocking are listed in `ignoredBuiltDependencies` with a note on what each
script does. A new dependency that wants to run one will fail the install rather
than slip through; add it to whichever list is right, with a reason.

## Publishing and lint dependencies

The root `pwrdrvr@1.1.2` CLI is used by the app build, publishing/preflight,
and PR cleanup workflows. It replaces the legacy `@pwrdrvr/microapps-publish`
package and allows current AWS SDK releases instead of pinning SDK 3.78.0.

Root ESLint remains in use for the app and CDK stack; the construct has its own
lint tooling. The root `pnpm.overrides` pins compatible security fixes for
remaining shared tooling dependencies. Selectors are limited to the affected
major or parent where APIs differ across versions. Review and remove these pins
when their parent dependencies are upgraded. All releases must pass
`pnpm deps:maturity`; do not exempt an override from the seven-day cooldown.

## Trying out `esbuild` on `server.js`

```
esbuild server.js --bundle --outfile=smol.js --platform=node --external:next/dist/pages/_error --external:critters --external:next/dist/pages/_app --external:next/dist/pages/_document --minify --target=node22
```

Builds, but fails at runtime with:

```
Cannot read properties of undefined (reading 'publicRuntimeConfig')
```

## Debugging the Next.js App

Either run commands from the `packages/app` directory OR run from the root and use the workspace flag. Examples:

- From Project Root

  - Start App: `pnpm --filter @pwrdrvr/microapps-app-release dev`
  - Build: `pnpm --filter @pwrdrvr/microapps-app-release build`
  - Debug: `pnpm --filter @pwrdrvr/microapps-app-release debug`

- From `packages/app/` Directory

  - Start App: `pnpm dev`
  - Build: `pnpm build`
  - Debug: `pnpm debug`

- Open Local App in Browser

  - http://localhost:3000/release/0.0.0

- VS Code: Launch `Attach to pnpm debug` config
- Breakpoints in .ts files should get hit

Issues: if the breakpoints don't get hit, make sure that `.env.development` has `NODE_ENV=development` and not `NODE_ENV=production` (which causes source maps to not be built).

## nextjs-redux-wrapper

Version 7.0.0-rc.1 added support for use together with `@reduxjs/toolkit`:

https://github.com/kirill-konshin/next-redux-wrapper/releases/tag/7.0.0-rc.1

Prior to this version the type of store.dispatch was not awaitable - Only the type info was wrong, the actual store.dispatch function was awaitable as described in this issue:

https://github.com/kirill-konshin/next-redux-wrapper/issues/207

Instructions for using Redux-Toolkit with Next-Redux-Wrapper have been added in version 7.0.0:

https://github.com/kirill-konshin/next-redux-wrapper/pull/295/files#diff-b335630551682c19a781afebcf4d07bf978fb1f8ac04c6bf87428ed5106870f5R641

## Adding Storybook to Existing NPM React / Next Project

`npm i -g sb`
`npx sb init -N`
`npx sb upgrade --prerelease -N`

# Projen Notes

`packages/cdk-construct/.projenrc.js` is now the source of truth for the construct package metadata and version floor. If the generated package files drift after a dependency change, rerun:

```sh
pnpm --filter @pwrdrvr/microapps-app-release-cdk run projen
```

The construct package is published to npm only. Python, .NET, and Java jsii artifacts are no longer part of this repo's supported release surface.

Historical jsii / TypeScript failures around `skipLibCheck` looked like this:

[tsc does not allow flags when --build is passed](https://github.com/microsoft/TypeScript/issues/25613)

```log
node_modules/flatpickr/dist/types/instance.d.ts:37:21 - error TS2304: Cannot find name 'Node'.

37     pluginElements: Node[];
                       ~~~~

node_modules/flatpickr/dist/types/instance.d.ts:82:56 - error TS2304: Cannot find name 'HTMLElementTagNameMap'.

82     _createElement: <E extends HTMLElement>(tag: keyof HTMLElementTagNameMap, className: string, content?: string) => E;
                                                          ~~~~~~~~~~~~~~~~~~~~~

node_modules/flatpickr/dist/types/instance.d.ts:93:16 - error TS2304: Cannot find name 'Node'.

93     (selector: Node, config?: Options): Instance;
                  ~~~~

node_modules/flatpickr/dist/types/instance.d.ts:94:26 - error TS2304: Cannot find name 'Node'.

94     (selector: ArrayLike<Node>, config?: Options): Instance[];
                            ~~~~

node_modules/@types/carbon-components-react/lib/components/FileUploader/FileUploaderDropContainer.d.ts:46:80 - error TS2304: Cannot find name 'File'.

46     onAddFiles?: ((event: React.DragEvent<HTMLElement>, content: { addedFiles: File[] }) => void) | undefined;
                                                                                  ~~~~

node_modules/@types/overlayscrollbars/index.d.ts:348:19 - error TS2304: Cannot find name 'NodeListOf'.

348         elements: NodeListOf<Element> | ReadonlyArray<Element> | JQuery,
                      ~~~~~~~~~~

node_modules/@types/overlayscrollbars/index.d.ts:353:19 - error TS2304: Cannot find name 'NodeListOf'.

353         elements: NodeListOf<Element> | ReadonlyArray<Element> | JQuery,
                      ~~~~~~~~~~


Found 7 errors.
```
