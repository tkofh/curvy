# Releasing

Releases are automated with [Changesets](https://github.com/changesets/changesets) and published to npm via [trusted publishing](https://docs.npmjs.com/trusted-publishers) (GitHub Actions OIDC). No npm token exists anywhere — not in repo secrets, not on a maintainer's machine.

## Day-to-day flow

1. Land PRs with changeset files as usual (`pnpm changeset`).
2. On every push to `main`, the release workflow updates the **Version Packages** PR, which accumulates pending changesets into a version bump and changelog.
3. Merging that PR puts an unpublished version on `main`. The workflow detects this and queues the `publish` job against the `release` environment, which waits for reviewer approval.
4. Approve the deployment. The job re-runs lint, build, tests, and typecheck on the exact tree being published, then `changeset publish` publishes with provenance, pushes the `curvy@x.y.z` git tag, and creates the GitHub Release.

Pushes to `main` that leave nothing to publish (the current version is already on npm, or changesets are still pending) never request approval.

## Pre-release mode

The repo is currently in Changesets pre-release mode on the `alpha` tag (`.changeset/pre.json`):

- Publishes go to the `alpha` dist-tag on npm, not `latest`. `changeset publish` picks the tag from `pre.json` automatically.
- Consumed changeset files stay on disk and are recorded in `pre.json`'s `changesets` array. Never add entries to that array by hand — a changeset listed there is treated as already applied and gets skipped.

### Exiting pre-release (shipping 2.0.0)

1. Run `pnpm changeset pre exit` locally, commit the modified `pre.json`, and merge it to `main`.
2. The next Version Packages PR versions the package to `2.0.0`, deletes `pre.json` and all accumulated changeset files, and collapses the alpha history into a single `2.0.0` changelog entry.
3. Merge and approve as usual. This publish lands on `latest` — no workflow changes needed.
4. Optionally tidy the dist-tag afterwards: `npm dist-tag rm curvy alpha`.
