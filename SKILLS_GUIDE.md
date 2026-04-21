# PhonoMorph Skills Guide

A complete reference for the specialized Gemini CLI skills available in the PhonoMorph atlas project. These skills automate linguistic research and ensure data integrity.

## Available Skills

- **PhonoMorph Researcher**: `phonomorph-researcher` — Research and document historical sound shifts (e.g., [p] -> [b]).
- **PhonoMorph Allophone Researcher**: `phonomorph-allophone-researcher` — Research and document allophonic relationships between sounds.

---

## 1. PhonoMorph Researcher (`phonomorph-researcher`)

**Purpose**: Automates the search for linguistic evidence, examples, and scholarly sources to document a phonetic transformation.

**Activation**:
```bash
gemini skill activate phonomorph-researcher
```

**Key Capabilities**:
- **Automatic Research**: Queries Google Scholar, CyberLeninka, and linguistic databases for specific shifts.
- **Schema Compliance**: Ensures generated transformation JSON files adhere to the strict project schema (preamble, phoneticEffects, languageExamples, etc.).
- **Confidence Scoring**: Assigns Certainty (1-5) and Commonality (1-5) based on the quantity and quality of discovered evidence.

**When to use**: When you identify a missing link in the matrix and need to find academic backing to fill it.

---

## 2. PhonoMorph Allophone Researcher (`phonomorph-allophone-researcher`)

**Purpose**: Specialized for documenting synchronic relationships where two sounds are variants of the same phoneme in specific languages.

**Activation**:
```bash
gemini skill activate phonomorph-allophone-researcher
```

**Operating Modes**:
- **Mode A (Search by Sounds)**: Finds a language where two specific sounds (e.g., [n] and [ŋ]) are allophones.
- **Mode B (Search by Language)**: Lists all documented allophonic relationships within a specific language.

**Key Requirements**:
- Must include a `context` field describing the phonological environment (e.g., "intervocalic before unstressed vowel").
- Must add the `"Allophony"` tag to the transformation file.
- Must set `"isAllophone": true`.

**When to use**: When documenting synchronic variation (like English flapping [t] -> [ɾ]) rather than historical sound laws.

---

## Data Standards & Best Practices

### Certainty Scale (1-5)
- **5**: Named sound law with universal consensus (e.g., Grimm's Law).
- **4**: Well-documented in multiple families with strong historical consensus.
- **3**: Attested in 2+ families or 1+ family with strong primary evidence.
- **2**: Sparse or disputed evidence.
- **1**: Weak/unverified; should likely be marked as "unattested" instead.

### Commonality Scale (1-5)
- **5**: Cross-linguistically ubiquitous (10+ unrelated families).
- **4**: Frequent (5-9 families).
- **3**: Common (2-4 families).
- **2**: Rare (1-2 families).
- **1**: Near-unique or highly isolated.

### Quality Checklist
1. **Academic Sources**: Prefer direct links to publisher pages (Cambridge, Routledge) or Archive.org over general Wikipedia links.
2. **Specific Examples**: Provide actual words with "from" and "to" forms; avoid generic "Various languages" placeholders.
3. **Specific Families**: Use specific clades like "Romance" or "Germanic" instead of generic "Indo-European".
4. **Environment Documentation**: Always explain *why* a shift happens (e.g., "before high front vowels").

---

## Development Workflow

1. **Activate Skill**: Choose the relevant skill for your task.
2. **Research & Populate**: Use the skill's guidance to find evidence and create/update files in `public/data/transformations/`.
3. **Rebuild Index**: Ensure the matrix reflects your changes.
   ```bash
   npm run rebuild-index
   ```
4. **Validate Links**: Ensure all new citations are reachable.
   ```bash
   npx tsx scripts/validate-links.ts
   ```
5. **Run Tests**: Verify data integrity with the Vitest suite.
   ```bash
   npm run test
   ```

---
**Last Updated**: 2026-04-19
**Project Repository**: [PhonoMorph Atlas](https://github.com/komapc/phonomorph)
