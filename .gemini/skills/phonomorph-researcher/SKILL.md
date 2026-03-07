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
5.  **Fast Failure**: If no *regular, historical* phonetic shift exists after searching these deep sources, mark as unattested and move on.


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

## 3. Automation
After saving the JSON file, update the index:
```bash
node -e "const fs=require('fs'); const idx=JSON.parse(fs.readFileSync('public/data/index.json')); const t='{fromId}_to_{toId}'; if(!idx.transformations.includes(t)){idx.transformations.push(t); idx.transformations.sort(); fs.writeFileSync('public/data/index.json', JSON.stringify(idx, null, 2)); console.log('Index updated for '+t);}"
```
