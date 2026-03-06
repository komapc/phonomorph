---
name: phonomorph-researcher
description: Research and document phonetic transformations (e.g., [p] -> [b]) for the PhonoMorph atlas. Use to find linguistic evidence, examples, and scholarly sources to fill an empty cell in the sound matrix.
---

# PhonoMorph Researcher

Research and document phonetic transformations between two IPA symbols.

## 1. Research Protocol

1.  **Internal Knowledge First**: Rely on your deep training in historical linguistics to identify standard shifts (e.g., lenition, Grimm's Law, palatalization, rhotacism, debuccalization).
2.  **Targeted Search**: ONLY use `google_web_search` if you lack specific language examples or require an authoritative source citation. Use parallel queries to minimize turns.
3.  **Strict Evaluation**: If no *regular, historical* phonetic shift exists (e.g., [r] to [p]), stop immediately. Output: "No documented regular phonetic transformation found for [from] -> [to]."
4.  **Directional Check**: If you find a transformation [A] -> [B], evaluate if the inverse [B] -> [A] is also a documented, regular phonetic shift.
    *   If [B] -> [A] is documented, create BOTH files.
    *   If [B] -> [A] is trivial or extremely common (e.g., simple voicing/devoicing in specific environments), document both.

## 2. Data Population

Use the `write_file` tool to save the transformation.

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

## 3. Index Update
After saving the JSON file, you MUST execute this exact shell command to update the index safely:

```bash
node -e "const fs=require('fs'); const idx=JSON.parse(fs.readFileSync('public/data/index.json')); const t='{fromId}_to_{toId}'; if(!idx.transformations.includes(t)){idx.transformations.push(t); idx.transformations.sort(); fs.writeFileSync('public/data/index.json', JSON.stringify(idx, null, 2)); console.log('Index updated for '+t);}"
```
