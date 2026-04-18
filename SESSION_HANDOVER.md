# Session Handover: PhonoMorph Data Audit

## Request
1.  **Quantify** the number of "holes" (missing phonetic transformations) in the current retroflex audit pipeline.
2.  **Analyze** redundancies in sound descriptions (cases where two different symbols/IDs describe the same or nearly identical phonetic events).

## Findings

### 1. Quantification of Data Gaps
A total of **1,017** missing transformation pairs ("holes") are currently staged for research:
*   **192 pairs** in `missing_pairs.json`: Focuses on bidirectional shifts between 24 vowels and 4 core retroflex consonants (`n_retroflex`, `l_retroflex`, `retroflex_stop_voiced`, `retroflex_flap`).
*   **825 pairs** in `new_holes.json`: A broader set of missing shifts involving retroflex affricates and fricatives (`ch_retroflex`, `sh_retroflex`, etc.).
*   *Note*: 97 additional candidates exist in `candidate_pairs.json` for potential inclusion.

### 2. Redundancy & Naming Analysis
The "2 different ways to describe the same sound" problem manifests in two primary ways:

#### A. Phonetic Overlap (Palatal vs. Palatalized)
The system maintains distinct IDs for sounds that are often used interchangeably in different linguistic traditions:
*   **Palatalized Alveolars**: `t_pal` ([tʲ]) and `d_pal` ([dʲ]).
*   **True Palatals**: `t_palatal` ([c]) and `d_palatal` ([ɟ]).
*   *Impact*: A transformation documented as `a_to_c` might be missed if the system only looks for `a_to_t_pal`.

#### B. Naming Inconsistencies
There is a lack of prefix/suffix uniformity in the `public/data/symbols/` directory:
*   **Retroflex**: Uses both suffixes (`n_retroflex`, `l_retroflex`, `sh_retroflex`) and prefixes (`retroflex_stop`, `retroflex_flap`).
*   **Palatal**: Uses both `_pal` (for palatalized) and `_palatal` (for place of articulation).
*   **Aspirated**: Uses the `_aspirated` suffix (e.g., `p_aspirated`, `ch_retroflex_aspirated`).

## Next Steps
*   Decide whether to collapse `t_pal` and `t_palatal` into a single "Palatal" category or maintain the fine-grained distinction.
*   Standardize symbol naming conventions (e.g., move all descriptors to suffixes).
*   Prioritize the 1,017 holes using PHOIBLE data to find the most "plausible" shifts.
