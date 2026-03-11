# PhonoMorph Skills Guide

A complete reference for all available skills in the PhonoMorph atlas project.

## Quick Start

Available skills:
- `/fill` — Research and create new phonetic transformation files
- `/improve` — Enhance documentation and verify sources for existing files
- `/analyze` — Pattern detection and coverage analysis
- `/allophone` — Document allophonic relationships between sounds
- `/family-shift` — Research transformations within language families
- `/validate` — Quality assurance and data integrity checking
- `/batch` — Parallel processing of multiple shifts

---

## Skill Reference

### 1. /fill — Create New Transformations

**Purpose**: Research undocumented phonetic shifts and generate new transformation JSON files.

**Usage**:
```
/fill shift_name
```

**Example**:
```
/fill d_to_sh
```

**What it does**:
1. Checks if shift already documented in `public/data/index.json`
2. Identifies source and target sounds from `public/data/symbols/`
3. Researches the shift across Google Scholar, CyberLeninka, JSTOR, Wikipedia
4. Generates JSON with schema: preamble, phoneticEffects, languageExamples, sources, tags
5. Updates index.json with new transformation
6. Reports findings with sources and confidence level

**Output**: New file in `public/data/transformations/{shift_name}.json`

**Key Criteria**:
- Certainty 1-5 scale (1=weak evidence, 5=universal sound law)
- Commonality 1-5 scale (1=rare/isolated, 5=many language families)
- Minimum 2 language examples from different families
- All sources as URLs where possible

**When to use**: When you need to document a new phonetic shift with proper research.

---

### 2. /improve — Enhance Existing Files

**Purpose**: Improve data quality, verify sources, and fix documentation for existing shifts.

**Usage**:
```
/improve shift_name
```

**Example**:
```
/improve b_to_v
```

**What it does**:
1. Reads existing transformation file
2. Research each source in English, German, Russian
3. Verifies claims against sources
4. Applies style fixes:
   - phoneticEffects: title case, no period, comma-separated
   - sources: full URLs preferred
   - languageFamily: most specific clade
   - tags: process terms first, then families
   - period: only if historically bounded
5. Corrects factual errors
6. Reports all changes made

**Output**: Updated file with verified sources and improved documentation

**Key Improvements Made**:
- Source verification (URL validation)
- Style standardization
- Certainty/commonality adjustment based on evidence
- Missing period field addition
- Duplicate tag removal

**When to use**: When improving documentation quality or verifying source reliability.

---

### 3. /analyze — Pattern Detection

**Purpose**: Discover patterns and gaps in the atlas.

**Usage**:
```
/analyze pattern_type
```

**Pattern Types**:
- `/analyze lenition` — Show all lenition pathways
- `/analyze gaps` — Identify missing plausible shifts
- `/analyze coverage` — Language family coverage metrics
- `/analyze frequency` — Most common source/target sounds
- `/analyze patterns` — Cross-family universal patterns

**Example Output** (lenition):
```
TOP LENITION CHAINS:
1. b → β → v → ∅ (12 languages)
2. t → s → ∅ (9 languages)
3. g → ɣ → ∅ (8 languages)

MISSING LINKS:
- β → ∅ documented in only 3 languages
- ɣ → approximant missing entirely
```

**When to use**: When planning research priorities or understanding atlas structure.

---

### 4. /allophone — Document Allophonic Relationships

**Purpose**: Search for and document allophonic variants between two sounds.

**Usage**:
```
/allophone sound_a sound_b
```

**Example**:
```
/allophone e_nas e
```

**What it does**:
1. Searches for allophonic relationships in English, German, Russian
2. Looks for complementary distribution or stress-conditioning
3. Verifies with peer-reviewed sources
4. Adds `isAllophone: true` field to relevant files
5. Documents language, environment, and source

**Output**: Updated transformation files with allophone documentation

**Requirement**: Must have at least one quality linguistic source confirming the allophonic relationship.

**When to use**: When identifying phonologically conditioned alternations.

---

### 5. /family-shift — Language Family Research

**Purpose**: Research and populate phonetic shifts for a specific language family.

**Usage**:
```
/family-shift family_name
```

**Example**:
```
/family-shift germanic
```

**What it does**:
1. Identifies all documented shifts in language family
2. Researches gaps and missing shifts
3. Creates new files for family-specific transformations
4. Documents language family phonological patterns

**When to use**: When doing deep research on a particular language family.

---

### 6. /validate — Quality Assurance

**Purpose**: Check data integrity and consistency across the atlas.

**Usage**:
```
/validate [scope]
```

**Scopes**:
- `/validate all` — Full atlas audit
- `/validate recent` — Recently modified files
- `/validate sources` — Source URL verification
- `/validate schema` — JSON schema compliance

**Checks**:
- JSON syntax validity
- Required fields (fromId, toId, preamble, phoneticEffects, sources, tags)
- Certainty/commonality in range 1-5
- Source URLs resolve correctly
- languageFamily specificity (no "Indo-European" for specific families)
- Tag capitalization and duplicates
- Example quality (actual language forms, not generic placeholders)

**When to use**: Before creating a PR or bulk commit.

---

### 7. /batch — Parallel Processing

**Purpose**: Orchestrate large-scale changes across multiple files.

**Usage**:
```
/batch fill 10
/batch improve 20
```

**What it does**:
1. Breaks task into 5-30 independent units
2. Launches parallel agents in isolated worktrees
3. Tracks progress in real-time
4. Creates PRs for each completed unit

**Example**:
```
/batch fill 10
→ Creates 10 parallel agents
→ Each researches one shift
→ Each creates PR independently
→ Status table tracks progress
```

**When to use**: For bulk improvements or research campaigns (10+ files).

---

## Workflow Examples

### Scenario 1: Create New Shift

```bash
# 1. Research using /fill
/fill t_to_v

# 2. If attested, improve documentation
/improve t_to_v

# 3. Validate
/validate

# 4. Create PR
git commit -m "feat: add t_to_v spirantization"
gh pr create
```

### Scenario 2: Identify and Fix Gaps

```bash
# 1. Find missing links
/analyze gaps

# 2. Fill top 3 gaps
/fill g_to_x
/fill k_to_x
/fill d_to_z

# 3. Batch improve for quality
/improve g_to_x
/improve k_to_x
/improve d_to_z

# 4. Validate everything
/validate all

# 5. Create PR
git commit -m "feat: add 3 velar spirantization gaps"
gh pr create
```

### Scenario 3: Document Allophones

```bash
# 1. Find allophonic relationships
/allophone e_nas e
/allophone a_nas a
/allophone o_nas o

# 2. Check coverage
/analyze coverage

# 3. Improve affected files
/improve e_nas_to_e
/improve a_nas_to_a
/improve o_nas_to_o

# 4. Create PR
git commit -m "feat: document nasalization allophones in English"
gh pr create
```

---

## Data Standards

### Certainty Scale (1-5)
- **5** = Named sound law with universal scholarly agreement (Grimm's Law, Great Vowel Shift)
- **4** = Well-documented in multiple language families, historical consensus
- **3** = Attested in 2+ language families OR 1+ family with strong evidence
- **2** = Sparse or disputed evidence, single language or weak documentation
- **1** = Weak/unverified evidence, placeholder entries

### Commonality Scale (1-5)
- **5** = Occurs in many unrelated language families (10+)
- **4** = Occurs in several language families (5-9)
- **3** = Occurs in 2-4 language families
- **2** = Rare, typically 1-2 families
- **1** = Isolated, single language or near-unique

### phoneticEffects Format
```
"Correct": "Spirantization, Lenition, Devoicing"
"Wrong": "Spirantization, lenition, devoicing."
"Wrong": "Spirantization (process)."
```

### Language Family Specificity
```
Correct: "Germanic", "Romance", "Slavic", "Sino-Tibetan"
Wrong: "Indo-European" (too generic)
Wrong: "Germanic Languages" (redundant)
```

---

## File Schema

### Minimal Valid Transformation
```json
{
  "fromId": "b",
  "toId": "v",
  "preamble": "Shift description (1-2 sentences).",
  "phoneticEffects": "Spirantization, Lenition",
  "languageExamples": [
    {
      "language": "Spanish",
      "languageFamily": "Romance",
      "examples": [
        {
          "from": "habēre (Latin)",
          "to": "[aβer]",
          "note": "Intervocalic /b/ spirantized to [β]"
        }
      ]
    }
  ],
  "certainty": 4,
  "commonality": 5,
  "sources": ["https://example.com/source"],
  "tags": ["Spirantization", "Lenition", "Romance"]
}
```

### Optional Fields
- `period` — "Proto-Germanic period", "Medieval Latin"
- `related` — chain/branch references to other shifts
- `isAllophone` — true if allophonic variation (not historical change)
- `context` — phonological environment description
- `languages` — array of languages where allophone attested

---

## Best Practices

1. **Always verify sources** — Use academic databases, not just Wikipedia
2. **Research multiple languages** — Seek patterns across families
3. **Be specific with examples** — Use actual language forms, not placeholders
4. **Use correct families** — "Romance" not "Indo-European", "Germanic" not "Indo-European"
5. **Tag consistently** — Process name first, then family name
6. **Document context** — Explain phonological conditions (intervocalic, before nasal, etc.)
7. **Mark allophones** — If stress-conditioned or complementary distribution
8. **Check certainty** — Only mark 4-5 for truly universal or well-documented shifts

---

## Troubleshooting

### "File already in index but missing"
→ Use `/fill` to research and create the file

### "Source URL is broken"
→ Use `/improve` to find and update source

### "Certainty too low (1-2)"
→ Mark as unattested in index.json instead

### "Examples are generic ('Various languages')"
→ Use `/improve` to add real language examples with sources

### "Missing allophone documentation"
→ Use `/allophone` to research and add `isAllophone` field

---

## Recent Workflow Summary

### Session Accomplishments
- ✅ Added 17 allophone documentations (PR #46)
- ✅ Documented d_to_sh yod-coalescence (PR #48)
- ✅ Identified 9 unattested shifts (b_to_z, p_to_z, b_to_x, etc.)
- ✅ Completed 461 vowel transformation gaps
- ✅ Created comprehensive skills documentation

### Current Atlas Stats
- **1603** total transformations
- **2561** language examples
- **27** documented allophones
- **89** language families

---

**Last updated**: 2026-03-11
**PhonoMorph Atlas**: [https://github.com/komapc/phonomorph](https://github.com/komapc/phonomorph)
