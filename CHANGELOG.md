# Changelog

## v0.7.0 - 2026-09-27

### Highlights

- Rebuilt the release console with responsive app navigation, release comparisons, a rules grid, and preview links. @huntharo (#106)
- Added confirmation, conflict detection, and a one-click revert for changes to an app's default version. @huntharo (#106)
- Restored the `.jsii` assembly in the npm package and added a packaging check so Construct Hub and JSII tooling can read the construct API. @huntharo (#141)
- Added the `aws-cdk` package keyword needed for Construct Hub discovery.

### Fixes

- Updated UI, build, test, and root tooling dependencies to address security advisories, including SemVer and Babel. @huntharo (#135, #142, #143)
- Upgraded CDK and Projen dependencies to address toolchain advisories. @huntharo (#144)

### Internal

- Updated GitHub Actions for current Node 24 releases and refreshed checkout, cache, artifact, and GitHub Script actions. @huntharo (#133), @dependabot[bot] (#121, #122, #123, #137, #145)
- Aligned CDK library and constructs dependency versions with the construct's peer dependency floor. @huntharo (#136)
- Updated JSII API comparison, CSS build, and TypeScript import resolution tooling. @dependabot[bot] (#126, #139, #140)

## v0.6.0 - 2026-09-21

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
- Expanded test coverage for supply-chain glob parsing and expansion. @huntharo (#128)
- Switched npm publication to short-lived GitHub OIDC credentials, including npm 11 support for trusted publishing. @huntharo (#129, #132)
