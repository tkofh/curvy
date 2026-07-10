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

## One-time setup

GitHub (do these **before** merging the workflows):

1. **Settings → Environments → New environment: `release`.** Add required reviewer (tkofh). Restrict deployment branches to `main`. If the environment doesn't exist, GitHub auto-creates it _without_ protection rules on first use — which would let a publish run unapproved.
2. **Settings → Actions → General → Workflow permissions.** Keep the default token read-only, and enable _Allow GitHub Actions to create and approve pull requests_ (required for the Version Packages PR).
3. **Settings → Actions → General → Actions permissions.** Select _Allow tkofh, and select non-tkofh, actions and reusable workflows_, check _Allow actions created by GitHub_, and allowlist `pnpm/action-setup@*,changesets/action@*`. Also enable _Require actions to be pinned to a full-length commit SHA_ so a tag- or branch-pinned action is refused outright.

npm (before approving the first publish):

4. **npmjs.com → `curvy` → Settings → Trusted publisher.** Select GitHub Actions with organization `tkofh`, repository `curvy`, workflow `release.yml`, environment `release`. Grant the `npm publish` permission only — not `npm stage publish`: the human gate here is the `release` environment approval, and `changeset publish` cannot drive staged publishing ([changesets#2025](https://github.com/changesets/changesets/issues/2025)). Equivalent CLI (npm ≥ 11.15, 2FA required): `npm trust github --repo tkofh/curvy --file release.yml --env release --allow-publish`. Until this exists, the OIDC exchange fails and the publish job errors — configure and re-run.

npm (after the first successful trusted publish):

5. **npmjs.com → `curvy` → Settings → Publishing access.** Switch to the trusted-publisher-only option (disallow tokens). Then revoke any remaining npm tokens with publish rights to `curvy`. From this point, `npm publish` from a laptop is impossible by design.

## Caveats

- **CI on the Version Packages PR needs a manual nudge.** Because the PR is authored by `github-actions[bot]`, GitHub holds its CI run as "awaiting approval" — click _Approve workflow and run_ on the PR to run it. Each update to the PR branch (new changesets landing on `main` force-push it) re-queues the approval. The publish job re-runs the full verification suite regardless, so an unapproved CI run never means unverified code ships. If `main` ever gets required status checks, this click becomes mandatory before merging.
- **Version commits and release tags are signed.** `commitMode: github-api` makes changesets create commits and tags through the GitHub API, GPG-signed by GitHub and attributed to `github-actions[bot]` — this satisfies `main`'s verified-signatures rule.
- **Partial failure recovery.** If a publish succeeds on npm but tag push or the GitHub Release fails, a plain re-run is skipped by the publish gate (the version is now on npm). Push the tag manually: `git tag curvy@<version> && git push origin curvy@<version>`.
- **Superseded versions.** If another changeset lands on `main` between merging a Version Packages PR and its publish run, the gate holds that version back; it ships with the next Version Packages PR instead.
