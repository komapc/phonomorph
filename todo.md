# PhonoMorph TODO List

## Analytics & Statistics
- [ ] **Improve Statistics Dashboard**:
    - Make aggregate numbers visually smaller to save space.
    - Expand data granularity: Show number of documented allophones, total number of language examples, and total number of academic sources.
    - Add a "Research Health" indicator based on the example-to-pair ratio.

## Sound Inventory Expansion
- [ ] **Massive Sound Increase**:
    - Add palatalized consonants (e.g., [pʲ], [tʲ]).
    - Add nasalized vowels (e.g., [ã], [ẽ]).
    - Add common diphthongs (e.g., [ai], [au], [ei]).
    - Add common non-European sounds (e.g., clicks, retroflex variants, implosives).
- [ ] **Inventory Controls**:
    - Keep these new sounds hidden by default to prevent matrix bloat.
    - Add toggle controllers (checkboxes/switches) to show/hide specific classes (Palatalized, Nasalized, Diphthongs).

## Linguistic Accuracy
- [ ] **Allophony vs. Diachronic Shifts**:
    - Audit existing data to ensure clear distinction between synchronic allophones (free variation/complementary distribution) and diachronic historical shifts.
    - Implement a visual or tagging distinction in the UI to separate these two relationship types.

## Data Deep Dive
- [ ] **10 "Interesting" Language Focus**:
    - Select 10 typologically diverse languages (e.g., Arabic, Quechua, Vietnamese, Finnish, Georgian, Zulu, etc.).
    - Use specialized skills (`phonomorph-researcher`, `phonomorph-allophone-researcher`) to exhaustively document their shifts and allophones.

## Visual & UI Polish
- [ ] **Commonality Heatmap**:
    - Map cell background color intensity to the `commonality` score (1-5).
    - Ensure text/labels remain high-contrast and readable over the colored backgrounds.
    - Remove the 5-dot "stars" commonality indicator if the heatmap provides sufficient visual feedback.
