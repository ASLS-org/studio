---
name: git-collaboration
description: Branching, commit messages, pull requests and release flow for ASLS Studio (Conventional Commits with path scopes, semantic-release, PRs always into develop). Use when creating a branch, writing a commit message, committing, opening or describing a PR, or answering questions about releases.
---

# Git, PRs and releases

## Branch flow

```
feat/<topic> | fix/<topic> | docs/<topic> | chore/<topic>
        │  PR (always)
        ▼
     develop ──► staging (pre-release vX.Y.Z-rc.N + demo deploy) ──► master (release vX.Y.Z)
```

- Branch off an up-to-date `develop`: `git fetch && git switch -c feat/<topic> origin/develop`.
- **PRs always target `develop`.** Never open a PR against `staging` or `master` from a feature
  branch. Promotions are done by the maintainer.
- Pushing to `staging`/`master` runs semantic-release (`.github/workflows/release.yaml`) and
  deploys (`deploy.*.yaml`). Never push to them directly.
- Commit or push only when the user asks. Never force-push shared branches.

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
`models/DMX`, `models/utils`, `views/uikit`, `views/modifiers`, `views/toolbar`, `views/app`,
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

- [ ] Based on and targeting `develop`, rebased if behind.
- [ ] Touched files lint clean (`npx eslint <files>`).
- [ ] Verified in the app. Say how (web / Electron, steps).
- [ ] Manual updated, or "n/a" with a reason (skill `user-manual`).
- [ ] AI context updated, or "n/a" (skill `ai-context-maintenance`).
- [ ] OpenSpec change linked and validated (`openspec validate <change>`) if one exists.
- [ ] Showfile compatibility stated: does an older showfile still load?

Create it with `gh pr create --base develop --fill-first` and then edit the body, or with
`--body-file`. Mention people only with real GitHub logins.

## Collaboration hygiene

- Big or directional changes: open a GitHub Discussion or an OpenSpec proposal first.
- Keep PRs reviewable (roughly < 400 changed lines excluding fixtures and media). Split otherwise.
- Never commit secrets. `.env` is tracked and holds public URLs only; local overrides go in
  `.env.local` (ignored).
- Don't commit build output (`dist/`, `out/`, `docs/**/dist`), `src/electron/bin/`, or
  `.claude/settings.local.json`.
