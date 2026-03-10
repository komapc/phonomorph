---
name: phonomorph-allophone-researcher
description: Research and document allophonic relationships between IPA symbols. Supports Mode A (finding a language where a pair of sounds are allophones) and Mode B (finding all allophones in a specific language).
---

# PhonoMorph Allophone Researcher

Identify and document synchronically related sounds (allophones) for the PhonoMorph atlas.

## 1. Research Modes

### Mode A: Pair-Based Search
Given two IPA symbols [A] and [B], find a language or phonetic phenomenon that makes them allophones.
1.  **Search Strategy**: Use `google_web_search` with queries like `"[A]" and "[B]" allophones`, `"allophones of [A]"`, or `"distribution of [A] and [B] phonology"`.
2.  **Verification**: Confirm that the sounds are in complementary distribution or are free variants in at least one documented language.
3.  **Documentation**: Follow the schema in [references/schema.json](references/schema.json). Use `tags: ["Allophony"]`.

### Mode B: Language-Based Search
Given a language [X], find all documented allophonic relationships and fill the corresponding cells in the PhonoMorph matrix.
1.  **Search Strategy**: Use `google_web_search` with queries like `"phonology of [X] language"`, `"[X] language allophones"`, or `"allophonic variation in [X]"`.
2.  **Inventory Check**: Map the findings to the available symbols in `public/data/symbols/`.
3.  **Batch Filling**: Create or update JSON files for every identified pair. If [A] has allophone [B], create `a_to_b.json`.

## 2. Expert Protocol

1.  **Technical Terms**: Use terms like "Complementary Distribution", "Free Variation", "Neutralization", and "Context-Dependent" in the `phoneticEffects` and `preamble`.
2.  **Examples**: Always include the specific environment (e.g., "intervocalic", "word-final", "before front vowels") in the `examples[].note` field.
3.  **Academic Citations**: Prioritize linguistic handbooks (e.g., Handbook of the IPA), journal articles, and authoritative grammars.

## 3. Implementation

**File Path**: `public/data/transformations/{fromId}_to_{toId}.json`

**Automation**:
After creating or updating files, always run the rebuild script to bundle metadata:
```bash
npm run rebuild-index
```

**Index Update**:
If a pair was previously in the `unattested` list in `public/data/index.json`, remove it from that array before rebuilding.
