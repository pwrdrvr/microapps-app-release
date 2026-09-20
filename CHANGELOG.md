# Changelog

## v0.6.0 - 2026-09-20

### Highlights

- Strengthened the package supply chain with automated dependency-maturity and lockfile validation. @huntharo (#120)
- Modernized release tooling around pnpm and Node.js 22, and simplified the published JSII construct surface. @huntharo (#108, #111)

### Fixes

- Restored reliable main-branch build and deployment workflows, including shared Node configuration and repaired JSII and Storybook validation. @huntharo (#107, #110, #112)
- Made prerelease validation more robust. @huntharo (#109)
- Improved command-line flag handling and corrected local development rewrites. @huntharo (#92, #96)

### Internal

- Updated the bundled `minimatch` dependency. @dependabot[bot] (#90)
- Refined release command preparation and repository development configuration.
