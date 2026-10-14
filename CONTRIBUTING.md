# Contributing to EchoDrift

Each documented shift is one JSON file: `public/data/transformations/<fromId>_to_<toId>.json`.

## Schema

| Field | Type | Notes |
|---|---|---|
| `fromId`, `toId` | string | Must match the filename |
| `preamble` | string | Short, readable introduction |
| `phoneticEffects` | string | Title case, comma-separated, no trailing period |
| `languageExamples` | array | `{ language, languageFamily?, examples: [{ from, to, note? }] }` |
| `certainty`, `commonality` | integer 1-5 | |
| `sources` | string[] | Full URLs where possible; "Author (Year). Title." |
| `tags` | string[] | Process terms first, then language families; title case |
| `related` | array | `{ fromId, toId, label, type: "chain" \| "branch" }` |
| `isAllophone` | boolean | Only for synchronic allophony |

Use the most specific clade for `languageFamily` (e.g. "Italic", not "Indo-European", for Latin). Omit empty `note` fields.

## Before opening a PR

```bash
npm run validate-data   # schema check (also runs in CI)
npm run rebuild-index   # regenerates index and shards
npm run lint && npm test
```

Cells with no attested example belong in `public/data/unattested.json`, not as empty transformation files.
