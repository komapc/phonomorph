---
name: phonomorph-researcher
description: Research and document phonetic transformations (e.g., [p] -> [b]) for the PhonoMorph atlas. Use to find linguistic evidence, examples, and scholarly sources to fill an empty cell in the sound matrix.
---

# PhonoMorph Researcher

Research and document phonetic transformations between two IPA symbols.

## 1. Expert Research Protocol

1.  **Internal Knowledge First**: Rely on your deep training in historical linguistics.
    *   **Vowels**: Check for Raising/Lowering, Fronting/Backing (Umlaut), Rounding/Unrounding, and Centralization (Reduction).
    *   **Consonants**: Check for Lenition scales (Plosive -> Fricative -> Approximant -> Zero), Fortition, Palatalization, and Place Assimilation.
2. **Directional Check**: If you find [A] -> [B], check if the inverse [B] -> [A] is a documented, regular shift. Document both if valid.
3.  **Targeted Search**: Use `google_web_search` with specific parameters:
    *   **Academic Deep Dive**: Use `site:scholar.google.com`, `site:books.google.com`, and `site:cyberleninka.ru`.
    *   **Search Operators**: Use quotes for exact shifts (e.g., `"ʁ to l"` or `"uvular fricative" to "l"`) and the `OR` operator for variations.
    *   **Linguistic Repositories**: Look for papers in JSTOR, Project MUSE, or university repositories (e.g., `site:edu "phonetic shift"`) found via Google.
    *   **CyberLeninka Specialization**: For Slavic or Eurasian shifts, CyberLeninka is a primary source.
4.  **Wikification**: Ensure sound names and language names match their standard Wikipedia titles for easy linking.
5.  **No generic language placeholders**: Each `languageExamples[].language` must name a specific language ("Modern Greek", "Yoruba", "Old English"). Never write "Various languages", "Multiple families", or similar. If you cannot name at least one specific language with attested examples, output `{"unattested": true}` and move on.
6.  **Fast Failure**: If no *regular, historical* phonetic shift exists after searching these deep sources, mark as unattested and move on. It is better to skip than to fill a cell with speculative or generic content.


## 2. Data Population

**File Path**: `public/data/transformations/{fromId}_to_{toId}.json`

**Strict Data Schema**:
```json
{
  "fromId": "string",
  "toId": "string",
  "preamble": "string (popular science intro)",
  "phoneticEffects": "string (technical terms)",
  "languageExamples": [
    {
      "language": "string",
      "languageFamily": "string (optional)",
      "examples": [
        { "from": "string", "to": "string", "note": "string (optional context)" }
      ]
    }
  ],
  "certainty": 5,
  "commonality": 5,
  "sources": ["string (citations)"],
  "tags": ["string (e.g., Romance, Indo-European, Lenition)"],
  "related": [
    { "fromId": "string", "toId": "string", "label": "string", "type": "chain | branch" }
  ]
}
```

### Certainty rubric — apply ALL gates

- **5**: A specific historical period or dialect is named (e.g., "Old English to Middle English", "Caribbean Spanish") AND at least one citation directly documents *this specific shift* (not a generic reference work).
- **4**: The shift is well-attested in the literature AND you have a specific (non-generic) citation, but it is not period-specific.
- **3**: Your only citations are generic reference works (Ladefoged & Maddieson 1996; Campbell 2013; Hock 1991; Crystal) — OR — plausible from phonetic principles AND you can name at least one specific language, but you have no citation at all.
- **2**: Speculative or marginal — strongly prefer `{"unattested": true}` instead.
- **1**: Do not produce. If you would assign 1, output `{"unattested": true}`.

If you are about to write `certainty: 5` with only `Ladefoged & Maddieson (1996)`, `Campbell (2013)`, or `Hock (1991)` as your citation, downgrade to 3.

## 2.5. Source Citation Rules — STRICT

Citations are the most fragile part of LLM-generated content. Hallucinated URLs and books degrade the atlas. Follow these rules.

1. **URLs**: Cite a URL ONLY if it was returned by your `google_web_search` tool in *this* response. Do NOT cite URLs you "recall" from training — fabricated Wikipedia and `archive.org` URLs are the dominant error mode (e.g., `Stopping_(phonetics)`, `Consonantalization`, `Vocalization_(phonetics)` — none of these articles exist). If grounding returned no URL for the specific shift, omit URLs entirely and cite via book/article only.

2. **Books**: Use the format `Author, A. (Year). Full Title. Publisher.` — the Year is mandatory; never write `(n.d.)`. Never use abbreviated forms like `Wells: Accents of English` or topic phrases like `Phonological history of Ancient Greek and Spanish.` If you cannot recall the publisher and full title with confidence, do not cite that book. Verify book titles against your training knowledge before citing — `Alkire & Rosen (2010). Romance Philology.` is wrong; the actual book is `Romance Languages: A Historical Introduction.`

3. **Articles**: `Author, A. (Year). Title. Journal Name, vol(num), pages.` — Year is mandatory. If you cannot find the year, do not cite that article.

4. **Specific over generic**: Prefer citations that directly discuss the shift you are documenting. Reference works (Ladefoged & Maddieson 1996; Campbell 2013; Hock 1991) are acceptable but should not be the *only* citation when a more specific source exists. If a reference work is your only citation, set certainty=3 (not 4 or 5).

5. **No placeholder text or non-academic sources**: Never write "Source via search", "verify before merge", "research snippets", "Cited in search result N", `(n.d.)`, or any phrase that signals "I have no real citation." Never cite Reddit, Quora, Stack Exchange, Wikipedia, languagehat.com, Scribd, Calaméo, or Internet Archive — these are not peer-reviewed sources. If you have no real academic citation, mark `{"unattested": true}`.

6. **No duplicate citations** within a single transformation's `sources` array.

## 3. Automation
After saving the JSON file (or modifying `unattested` in `index.json`), always rebuild the data index to bundle the new metadata:
```bash
npm run rebuild-index
```
Check `git status` to ensure `public/data/index.json` and the new transformation file are both staged for the next batch commit.
