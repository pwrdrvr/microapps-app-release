![Build/Deploy CI](https://github.com/pwrdrvr/microapps-app-release/actions/workflows/ci.yml/badge.svg) ![Main Build](https://github.com/pwrdrvr/microapps-app-release/actions/workflows/main-build.yml/badge.svg) ![Deploy](https://github.com/pwrdrvr/microapps-app-release/actions/workflows/deploy.yml/badge.svg)

# Overview

This is the Release Console for the MicroApps framework.

# Debugging the Next.js App

Either run commands from the `packages/app` directory OR run from the root and use the workspace flag. Examples:

- From Project Root

  - Start App: `npm run -w @pwrdrvr/microapps-app-release-app dev`
  - Build: `npm run -w @pwrdrvr/microapps-app-release-app build`
  - Debug: `npm run -w @pwrdrvr/microapps-app-release-app debug`
  - Package Serverless: `npx -w @pwrdrvr/microapps-app-release-app serverless`

- From `packages/app/` Directory

  - Start App: `npm run dev`
  - Build: `npm run build`
  - Debug: `npm run debug`
  - Package Serverless: `npx serverless`

- Open Local App in Browser

  - http://localhost:3000/release/0.0.0

- VS Code: Launch `Attach to npm run debug` config
- Breakpoints in .ts files should get hit

Issues: if the breakpoints don't get hit, make sure that `.env.development` has `NODE_ENV=development` and not `NODE_ENV=production` (which causes source maps to not be built).
