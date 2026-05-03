# Auto-Fill Pipeline

Automated research and population of empty cells in the PhonoMorph atlas using
Gemini 2.5 Flash with native Google Search grounding.

## Overview

Roughly 6,700 transformation pairs are marked unattested. Many are genuinely
implausible, but a significant subset have documented evidence in linguistic
literature. This pipeline researches each candidate and either writes a JSON
file or records the ID as "tried and unattested" — without per-file human
effort. A cron-driven GitHub Actions workflow processes a batch every 10
minutes and opens a pull request with any newly filled shifts for human review.

## Files

```
scripts/auto-fill.py                       # main research + fill script
.github/workflows/auto-fill.yml            # GHA workflow (cron + manual)
public/data/shards/autofill-tried.json     # permanent retirement (skipped + max-retries-exceeded)
public/data/shards/autofill-failed.json    # transient retry cache: {id: count}
docs/auto-fill-pipeline.md                 # this document
```

## Infrastructure

| Resource | Value |
|---|---|
| IAM role | `arn:aws:iam::272007598366:role/phonomorph-github-actions` |
| Role permissions | `secretsmanager:GetSecretValue` on `openclaw/*` only |
| Trust | `repo:komapc/phonomorph:*` via OIDC |
| GitHub secret | `AWS_ROLE_ARN` on `komapc/phonomorph` |
| Gemini key | `openclaw/gemini-api-key` in Secrets Manager (eu-central-1) |
| LLM | `gemini-2.5-flash` with Google Search grounding, `temperature=0.2` |

## Workflow: `.github/workflows/auto-fill.yml`

**Trigger.** Two paths:
- Scheduled: `cron: '*/10 * * * *'` — every 10 minutes
- Manual: `workflow_dispatch` with optional `batch_size` input (default `"30"`, no enforced max)

**Concurrency.** Group `auto-fill` with `cancel-in-progress: false`, so overlapping cron firings queue rather than racing each other on the tried-cache push.

**Permissions.** `contents: write`, `pull-requests: write`, `id-token: write`.

**Steps.**
1. `actions/checkout@v4` with `fetch-depth: 0` (the script needs full history for rebase-and-retry on the tried-cache push).
2. `aws-actions/configure-aws-credentials@v4` — assume `phonomorph-github-actions` via OIDC.
3. Set up Python 3.12, Node 20 (with npm cache).
4. `npm ci` and `pip install google-genai boto3`.
5. **Run** `python scripts/auto-fill.py` with `BATCH_SIZE` from the input (or `"30"`).
6. **Count filled transformations** — salvage step. Reads `/tmp/auto-fill-summary.json` if present; otherwise counts untracked files in `public/data/transformations/` via `git status --porcelain`. If the count is non-zero, runs `npm run rebuild-index` defensively (in case the script crashed before its own rebuild). This guards against pushing a broken index when the script fails partway through.
7. **Push branch** (only if filled > 0): creates `auto-fill/YYYY-MM-DD-HHMM`, commits all files in `public/data/transformations/`, `public/data/index.json`, `public/data/shards/`, and pushes.
8. **Create PR** (only if filled > 0): `gh pr create` with `--body-file /tmp/pr-body.md`. Falls back to a salvage body ("Salvaged N transformation(s) from a crashed auto-fill run") if the script never wrote one.
9. **Summary** (always): writes per-run counts (filled/skipped/failed) to `$GITHUB_STEP_SUMMARY`.

If the script fills nothing, no branch is created and no PR is opened — the run still succeeds.

## Script: `scripts/auto-fill.py`

### Phase 1 — Load secrets
Use `boto3` to fetch `openclaw/gemini-api-key` from Secrets Manager in `eu-central-1`. Falls back to the `GEMINI_API_KEY` env var if set (for local dev).

### Phase 2 — Load atlas data
- Unattested IDs from `public/data/shards/unattested-*.json`
- Existing transformation IDs from `public/data/shards/transformations-*.json`
- Symbol inventory from `public/data/index.json`
- **Tried cache** from `public/data/shards/autofill-tried.json` — set of IDs permanently retired (Gemini-confirmed unattested, or parse/schema failures that exceeded the retry limit)
- **Failed-retry cache** from `public/data/shards/autofill-failed.json` — dict `{id: retry_count}` of transient parse/schema failures eligible for retry

### Phase 3 — Select candidates

**Filter.** Drop any ID that is:
- already in the existing-IDs set, or
- already in the **tried** cache (permanent retirement), or
- already has a JSON file on disk, or
- has either symbol missing from the atlas inventory.

IDs in the **failed-retry** cache are NOT filtered out — they're eligible for re-research until they either succeed or exceed `MAX_FAILURE_RETRIES` and get promoted to `tried`.

**Score.** Each candidate `(from_id, to_id)` gets an integer score:

| Score | Rule |
|---|---|
| 0 | Either side is in `CLICK_IDS` (5 click types) — auto-skip |
| 0 | `from_id ∈ VOWEL_IDS` and `to_id ∈ STOP_NASAL_IDS` (vowel→stop is phonetically implausible) |
| 3 | `(from_id, to_id) ∈ HIGH_VALUE_PAIRS` (36 directed pairs: weakening chains like p→f, t→s, k→x; common vowel shifts a→e, e→i; assimilation pairs n→ŋ, l→r, s→ʃ, etc.) |
| 2 | Both sides consonants, or both sides vowels |
| 1 | Cross-category (vowel ↔ consonant) |

`HIGH_VALUE_PAIRS` is **directed** — `(p, f)` scores 3 but `(f, p)` does not.

**Pick.** Sort by `(-score, id)` and take top `BATCH_SIZE` (default 30). Stable alphabetical tie-break within a score class.

### Phase 4 — Research and fill (per candidate)

For each `{from_id}_to_{to_id}`:

1. Load `from`/`to` symbol metadata from `public/data/symbols/{id}.json`.
2. Build prompt:
   - Body of `.gemini/skills/phonomorph-researcher/SKILL.md` (YAML frontmatter stripped).
   - Both symbols as embedded JSON.
   - Four "CRITICAL OUTPUT RULES" forcing single-JSON-object output, no markdown fences, schema match, and the sentinel `{"unattested": true}` for negative results.
3. Call `gemini-2.5-flash` with `tools=[Tool(google_search=GoogleSearch())]` and `temperature=0.2`. If `response.text` is `None` (which happens with grounding active), assemble text from `response.candidates[*].content.parts[*].text`.
4. **Parse.** Extract JSON either from a ` ```json ` fence or the first `{...}` block.
5. **Three-way decision** (caches updated in Phase 8, not here):
   - `{"unattested": true}` → record as **skipped** (Gemini-confirmed negative)
   - Parse failure or schema invalid → record as **failed** (potentially transient)
   - Valid JSON → run `validate_and_fix`, then write `public/data/transformations/{id}.json` and record as **filled**
6. `time.sleep(0.2)` between calls.

### Phase 5 — `validate_and_fix`

Mutates the parsed dict in-place. Rejects (`return None`) on:
- Any of `REQUIRED_FIELDS` missing (`fromId`, `toId`, `preamble`, `phoneticEffects`, `languageExamples`, `certainty`, `commonality`, `sources`, `tags`)
- `certainty` or `commonality` not parseable as int, or outside 1–5
- `languageExamples` empty after auto-fix

Auto-fixes:
- Force `fromId`/`toId` to the script's expected values (overrides whatever Gemini returned).
- Strip trailing period from `phoneticEffects`; if a mid-sentence `". "` is present, truncate to the first segment (Gemini occasionally appends extra prose).
- **Filter Vertex AI grounding redirect URLs** from `sources` (anything containing `vertexaisearch` or `grounding-api-redirect` — these redirects are ephemeral). If only redirects were returned, substitute `"Source via Google Search grounding (verify before merge)"` and decrement `certainty` by 1 (min 1) so the entry is flagged for human source verification before merge.
- Drop `note: ""` from each example.
- Drop `related: []`.
- Reorder `tags` so process terms come before language-family terms (`FAMILY_TERMS` is a hard-coded set of ~36 family names).

### Phase 6 — Index rebuild
If anything was filled, run `npm run rebuild-index` to regenerate `index.json` and shards. (The workflow re-runs this defensively in step 6 above.)

### Phase 7 — Persist artifacts
- `/tmp/auto-fill-summary.json`: `{"filled": [...], "skipped": [...], "failed": [...]}` for the salvage step and the GHA step summary.
- `/tmp/pr-body.md`: PR body with counts and a bullet list of filled IDs.

### Phase 8 — Cache update and push (`save_caches`)

This is what makes the pipeline converge: each run retires IDs it just researched, so the cron loop is finite. Two caches keep parse failures separate from genuine negatives.

**State transitions** (computed in-memory, then persisted):

| This-run outcome | Cache update |
|---|---|
| **filled** | Removed from `failed-retry` (a successful fill cancels prior transient failures). |
| **skipped** (Gemini said `{"unattested": true}`) | Added to `tried` — permanent retirement. Also removed from `failed-retry` if previously there. |
| **failed** (parse or schema error) | Counter incremented in `failed-retry`. If new count ≥ `MAX_FAILURE_RETRIES` (default 3), promoted to `tried` and removed from `failed-retry`. |

The defensive "remove from failed-retry if it ended up in tried" pass at the end covers the `skipped`-while-previously-in-`failed-retry` case in one place.

**Persistence.** Both `autofill-tried.json` (sorted array of strings) and `autofill-failed.json` (dict of `{id: count}`) are written to disk, then bundled into a single git commit with message `ci: update autofill caches (tried: N | failed: M)` and pushed directly to master.

The push uses **rebase-and-retry** because master moves underneath us (concurrent merges of auto-fill PRs, other commits, etc.):

```
for attempt in 1..5:
  git push origin HEAD
  on success: return
  on failure:
    git fetch origin master
    git rebase origin/master
```

Neither cache file is modified by any other workflow, so the rebase should never produce a conflict.

If all 5 attempts fail, the script does `git reset --soft HEAD^` — keeping both file changes staged but undoing the commit — and raises. The PR-branch step in the workflow then bundles the cache updates into the PR commit alongside the new transformations. This is why step 7 of the workflow stages `public/data/shards/` (which globs both files).

`save_caches` no-ops if `GITHUB_ACTIONS` is not set (so local dev runs don't produce stray commits).

**Migration note.** Existing entries in `autofill-tried.json` are not touched by this scheme. The 346 IDs that were retired under the old "failed and skipped both go to tried" rule stay retired. Only new failures from this point forward use the retry counter.

### Phase 9 — Cron self-disable (`disable_cron_schedule`)

When `select_candidates` returns empty (every eligible ID has been tried), the script rewrites its own workflow file:
- Reads `.github/workflows/auto-fill.yml`
- Removes the `schedule:` block via regex
- Commits with message `ci: disable auto-fill cron — candidate pool exhausted`
- Pushes to master

After this point only manual `workflow_dispatch` runs remain. Like the tried-cache push, this is gated on `GITHUB_ACTIONS` to prevent local accidents.

## Cost and quota

| Item | Per run (30 candidates) |
|---|---|
| Gemini 2.5 Flash input + output | ~$0.01 |
| Search grounding | included |

**Quota note.** The cron `*/10 * * * *` schedule fires 144 times/day × 30 candidates = up to **4,320 calls/day**, which exceeds the Gemini free tier (1,500 RPD). Real load is lower because most cron runs hit candidates that get cached and the tried-cache will eventually exhaust the pool — but expect overage charges or rate-limit errors during the active phase. Workflow-level rate limiting is not currently in place; reduce the cron frequency or `BATCH_SIZE` if billing becomes an issue.

## Quality and safety

- All filled cells go through PR review before merge — no direct push to master for transformation files.
- Tried-cache and cron-disable commits **do** go directly to master (they are bookkeeping, not content).
- `validate-data.yml` runs on the PR and must pass before merge.
- `validate_and_fix` filters Vertex grounding redirects and degrades certainty when no real source survives — flagged entries are easy to spot in PR review.
- The pre-commit hook validates schema on every committed file.

## Limitations

- Gemini may hallucinate plausible-sounding examples — human PR review required.
- Search grounding works best for well-documented shifts; rare/exotic pairs come back unattested and get added to the tried cache permanently. (To re-research a tried ID, manually remove it from `autofill-tried.json`. To reset the retry counter on a transient failure, remove it from `autofill-failed.json`.)
- No access to paywalled journals (JSTOR, etc.).
- The 0.2 s inter-call delay is below Gemini's 15 RPM free-tier rate; with paid quota this is fine, but a free-tier run will hit 429s after ~15 calls.
