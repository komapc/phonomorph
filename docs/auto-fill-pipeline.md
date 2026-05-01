# Auto-Fill Pipeline

Automated research and population of empty cells in the PhonoMorph atlas using
Gemini 2.0 Flash with native Google Search grounding.

## Overview

6,698 transformation pairs are currently marked unattested. Many are genuinely
implausible, but a significant subset have documented evidence in linguistic
literature. This pipeline researches each candidate and writes a JSON file (or
leaves it unattested) without human effort per file.

A GitHub Actions workflow runs on demand (`workflow_dispatch`), processes a
configurable batch of candidates, and opens a pull request with the results for
human review before merge.

## Files

```
scripts/auto-fill.py              # main research + fill script
.github/workflows/auto-fill.yml   # GHA workflow
docs/auto-fill-pipeline.md        # this document
```

## Infrastructure

| Resource | Value |
|---|---|
| IAM role | `arn:aws:iam::272007598366:role/phonomorph-github-actions` |
| Role permissions | `secretsmanager:GetSecretValue` on `openclaw/*` only |
| Trust | `repo:komapc/phonomorph:*` via OIDC |
| GitHub secret | `AWS_ROLE_ARN` on `komapc/phonomorph` |
| Gemini key | `openclaw/gemini-api-key` in Secrets Manager (eu-central-1) |
| LLM | `gemini-2.0-flash` — search grounding enabled |

## Script: `scripts/auto-fill.py`

### Phase 1 — Load secrets
Assume the AWS role is already configured by the GHA step. Use `boto3` to fetch
`openclaw/gemini-api-key` from Secrets Manager in `eu-central-1`.

### Phase 2 — Select candidates
1. Read all unattested IDs from `public/data/shards/unattested-*.json`
2. Read all existing transformation IDs from `public/data/shards/transformations-*.json`
3. Read symbol inventory from `public/data/index.json`
4. **Filter** — skip candidates where either symbol is missing from the atlas
5. **Score** — rank by phonetic plausibility:

| Score | Candidates |
|---|---|
| High | Consonant weakening chains (p→f, t→s, k→x, f→h), common vowel shifts (raising/lowering/fronting), assimilation pairs (n→ŋ, l→r, s→ʃ) |
| Medium | Less common but attested shift types, single-family patterns |
| Low/skip | Vowel→stop, non-adjacent feature jumps, cross-category leaps with no phonetic motivation |

6. Pick top `BATCH_SIZE` candidates (default: 30, configurable via workflow input)

### Phase 3 — Research and fill (per candidate)
For each candidate `{fromId}_to_{toId}`:

1. Build prompt from the `phonomorph-researcher` skill (`.gemini/skills/phonomorph-researcher/SKILL.md`)
2. Call `gemini-2.0-flash` with `google_search_retrieval` tool enabled
3. Parse response — extract JSON from markdown code block if present
4. **Validate** against schema:
   - Required fields present
   - `certainty` and `commonality` in 1–5
   - `phoneticEffects` has no trailing period
   - Tags: process terms before language families
   - No empty `note` fields
5. **Decision:**
   - Valid JSON with evidence → write `public/data/transformations/{id}.json`
   - Gemini says unattested → skip (stays in unattested list)
   - Parse/validation failure → log warning, skip

### Phase 4 — Rebuild index
Run `npm run rebuild-index` to regenerate `index.json` and all shards.

### Phase 5 — Commit and PR
- Branch: `auto-fill/YYYY-MM-DD-HHmm`
- Commit: `docs: auto-fill N transformations via Gemini research`
- PR title: `auto: fill N phonetic transformations (Gemini 2.0 Flash)`
- PR body: table of filled transformations + count of skipped-unattested + any failures

## Workflow: `.github/workflows/auto-fill.yml`

```
trigger: workflow_dispatch
  inputs:
    batch_size: number (default 30, max 100)

steps:
  1. checkout (full history for gh cli)
  2. configure-aws-credentials (OIDC → phonomorph-github-actions role)
  3. setup python 3.12
  4. setup node 20 + npm ci
  5. pip install google-generativeai boto3
  6. python scripts/auto-fill.py
  7. if any files written: push branch + gh pr create
  8. if nothing written: exit 0 (no PR needed)
```

Permissions needed on the job: `contents: write`, `pull-requests: write`,
`id-token: write`.

## Cost estimate

| Item | Per run (30 files) |
|---|---|
| Gemini 2.0 Flash input | ~$0.002 |
| Gemini 2.0 Flash output | ~$0.004 |
| Search grounding | Free (included) |
| **Total** | **< $0.01** |

Free tier (1,500 req/day) covers ~50 full runs per day before any charge.

## Rate limits

Gemini 2.0 Flash free tier: 15 RPM, 1,500 RPD. The script processes
candidates sequentially with a 1-second delay between calls. A batch of 30
takes ~2 minutes and uses 30 of the 1,500 daily quota.

## Quality and safety

- All output goes through PR review before merge — no direct push to master
- The existing `validate-data.yml` CI runs on the PR and must pass before merge
- Gemini's search grounding cites sources inline; sources are preserved in the JSON
- Low-confidence fills get `certainty: 1-2` — easy to filter or re-research later
- The pre-commit hook validates schema on every file before the commit

## Limitations

- Gemini may hallucinate plausible-sounding but uncited examples — human review required
- Search grounding works best for well-documented shifts; rare/exotic pairs may still come back unattested
- Gemini does not have access to paywalled journals (JSTOR, etc.) — free web sources only
