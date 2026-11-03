---
name: git-collaboration
description: Branching, commit messages, pull requests and release flow for ASLS Studio (one branch per change from develop, hotfixes from master, quickwins on develop, no pushes to long-lived branches without validation, Conventional Commits, semantic-release). Use before starting any implementation or /opsx:apply, when creating a branch, writing a commit message, committing, pushing, opening or describing a PR, or answering questions about releases.
---

# Git, PRs and releases

## Branch flow

```
feat/<topic> | fix/<topic> | docs/<topic> | chore/<topic>    (from develop)
        │  PR
        ▼
     develop ──► staging (pre-release vX.Y.Z-rc.N + demo deploy) ──► master (release vX.Y.Z)
        ▲                                                             │
        └──────────── PR (back-merge) ◄── hotfix/<topic> ──── PR ─────┘ (from master)
```

Long-lived branches: `develop`, `staging`, `master`. Everything else is a work branch.

### Which branch to work on

Decide this before the first edit of any implementation (including `/opsx:apply`):

| The user calls the work... | Branch | Base | Lands via |
|---|---|---|---|
| nothing special (default) | `feat/` `fix/` `perf/` `refactor/` `docs/` `chore/<change-name>` | `develop` | PR into `develop` |
| a **hotfix** | `hotfix/<change-name>` | `master` | PR into `master`, then a back-merge PR of `master` into `develop` |
| a **quickwin** | none: commit on `develop` | `develop` | direct push to `develop`, **only after the user validates that push** |

- Every OpenSpec change gets its own branch, named after the change
  (`openspec/changes/<change-name>`), with the prefix matching its main commit type.
- Create it from an up-to-date base: `git fetch && git switch -c fix/<name> origin/develop`
  (or `origin/master` for a hotfix).
- If the current branch is unrelated work (another feature, the setup branch), don't build on it.
  Branch from the base anyway and say so.
- Only the user's own words make something a hotfix or a quickwin. Don't classify it yourself;
  when it looks like one, ask.

### Pushing

- **Never push to a long-lived branch (`develop`, `staging`, `master`) unless the user explicitly
  asks, and even then confirm the exact push (branch, commits) and wait for a yes before running
  it.** This covers quickwins too. `.claude/settings.json` makes these pushes prompt.
- Pushing to `staging`/`master` runs semantic-release (`.github/workflows/release.yaml`) and
  deploys (`deploy.*.yaml`). Promotions (`develop` → `staging` → `master`) are the maintainer's.
- Work branches: commit or push only when the user asks. Never force-push shared branches.

## Commit messages (semantic-release reads them)

```
<type>(<scope>): <imperative summary, lower case, no period, ≤ 72 chars>

<optional body: why, not what; wrap at 100>

<optional footer: BREAKING CHANGE: ..., Refs #123>
```

| Type | Release effect | Use for |
|---|---|---|
| `feat` | minor | user-visible capability |
| `fix` | patch | user-visible bug fix |
| `perf` | patch | performance |
| `refactor`, `style`, `docs`, `test`, `build`, `ci`, `chore` | none | everything else |
| any + `BREAKING CHANGE:` footer or `!` | major | incompatible showfile or behaviour change |

Scopes are path-like and match recent history:
`models/DMX`, `views/uikit`, `views/modifiers`, `views/toolbar`, `views/app`,
`views/group-pool`, `plugins/visualizer`, `plugins/wsc`, `router`, `electron`, `fixtures`,
`docs/manual`, `docs/dev`, `ai` (CLAUDE.md, `.claude/`, `openspec/`), `deps`, `build`, `ci`.

- One logical change per commit. Engine + UI + manual for one feature can be one `feat`, or split
  as `feat(models/DMX)` → `feat(views/modifiers)` → `docs(manual)`.
- Showfile format changes that older files can't load are `BREAKING CHANGE`. Prefer a fallback
  read so they aren't.
- Archived OpenSpec changes are committed with the code: `openspec/changes/archive/...` and the
  updated `openspec/specs/...` go into the same PR.
- Write no AI attribution trailers unless the repo settings add them.

## Pull requests

Use `.github/pull_request_template.md`. The title follows the commit format (it may become the
squash commit). Check before opening:

- [ ] Based on and targeting `develop` (hotfix: `master`, plus the back-merge PR), rebased if
      behind.
- [ ] Touched files lint clean (`npx eslint <files>`).
- [ ] Verified in the app. Say how (web / Electron, steps).
- [ ] Manual updated, or "n/a" with a reason (skill `user-manual`).
- [ ] AI context updated, or "n/a" (skill `ai-context-maintenance`).
- [ ] OpenSpec change linked and validated (`openspec validate <change>`) if one exists.
- [ ] Showfile compatibility stated: does an older showfile still load?

Create it with `gh pr create --base develop --fill-first` (`--base master` for a hotfix) and then edit the body, or with
`--body-file`. Mention people only with real GitHub logins.

## Collaboration hygiene

- Big or directional changes: open a GitHub Discussion or an OpenSpec proposal first.
- Keep PRs reviewable (roughly < 400 changed lines excluding fixtures and media). Split otherwise.
- Never commit secrets. `.env` is tracked and holds public URLs only; local overrides go in
  `.env.local` (ignored).
- Don't commit build output (`dist/`, `out/`, `docs/**/dist`), `src/electron/bin/`, or
  `.claude/settings.local.json`.
