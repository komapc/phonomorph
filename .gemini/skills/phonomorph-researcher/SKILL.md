---
name: phonomorph-researcher
description: Research and document phonetic transformations (e.g., [p] -> [b]) for the PhonoMorph atlas. Use when Gemini CLI needs to find linguistic evidence, examples, and scholarly sources to fill an empty cell in the sound matrix.
---

# PhonoMorph Researcher

This skill guides the research and documentation of phonetic transformations between two IPA symbols.

## Workflow

1.  **Identify the Transformation**: Determine the source sound (fromId) and target sound (toId).
2.  **Conduct Research**:
    *   Search the web for terms like "phonetic shift [from] to [to]", "[from] to [to] sound change", or "[from] to [to] lenition/fortition".
    *   Search academic resources (e.g., Google Scholar) for specific historical language examples (e.g., "Latin to Spanish [p] to [b]").
    *   Look for common names for the shift (e.g., "Rhotacism", "Palatalization", "Grimm's Law").
3.  **Evaluate Results**:
    *   If no historical or regular phonetic evidence is found, state: "No documented regular phonetic transformation found for [from] -> [to]."
    *   If evidence exists, identify:
        *   **Preamble**: A popular-science introduction.
        *   **Phonetic Effects**: Technical terms for the shift.
        *   **Language Examples**: Specific words and languages.
        *   **Sources**: High-quality bibliographic or web references.
        *   **Related Shifts**: Chain shifts or alternative branches.
4.  **Populate the Data**:
    *   Create or update the JSON file in `public/data/transformations/{fromId}_to_{toId}.json`.
    *   Ensure all symbols used are defined in `public/data/symbols/`.
    *   Update the `public/data/index.json` to include the new transformation if it's new.

## Data Schema

See `references/schema.json` for the exact structure. All fields are mandatory.

## Research Guidelines

- **Accuracy over Quantity**: Only document regular, systematic sound changes. Avoid one-off accidental typos or idiosyncratic shifts.
- **Source Quality**: Prioritize historical linguistics textbooks (Campbell, Hock, Lass) and peer-reviewed papers.
- **Explain "Why"**: In the preamble, explain the articulatory or acoustic reason for the shift (e.g., "ease of articulation between vowels").
- **Interconnect**: Always check if this shift is part of a larger chain (like the Great Vowel Shift or Grimm's Law) and link it using the `related` field.
