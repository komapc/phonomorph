# PhonoMorph TODO List

## Analytics & Statistics
- [x] **Improve Statistics Dashboard**:
    - [x] Make aggregate numbers visually smaller to save space.
    - [x] Expand data granularity: Show number of documented allophones, total number of language examples, and total number of academic sources.
    - [x] Add a "Research Health" indicator based on the example-to-pair ratio.

## Sound Inventory Expansion
- [x] **Massive Sound Increase**:
    - [x] Add palatalized consonants (e.g., [pʲ], [tʲ]).
    - [x] Add nasalized vowels (e.g., [ã], [ẽ]).
    - [x] Add common diphthongs (e.g., [ai], [au], [ei]).
    - [x] Add common non-European sounds (e.g., clicks, retroflex variants, implosives).
- [x] **Inventory Controls**:
    - [x] Keep these new sounds hidden by default to prevent matrix bloat.
    - [x] Add toggle controllers (checkboxes/switches) to show/hide specific classes (Palatalized, Nasalized, Diphthongs).

## Linguistic Accuracy
- [ ] **Allophony vs. Diachronic Shifts**:
    - [ ] Audit existing data to ensure clear distinction between synchronic allophones (free variation/complementary distribution) and diachronic historical shifts.
    - [x] Implement a visual or tagging distinction in the UI to separate these two relationship types (Added 'ALLO' badges).

## Data Deep Dive
- [x] **10 "Interesting" Language Focus**:
    - [x] Select 10 typologically diverse languages (Arabic, Quechua, Vietnamese, Nahuatl, etc.).
    - [x] Use specialized skills to document their shifts and allophones.

## Visual & UI Polish
- [x] **Commonality Heatmap**:
    - [x] Map cell background color intensity to the `commonality` score (1-5).
    - [x] Ensure text/labels remain high-contrast and readable over the colored backgrounds.
    - [x] Remove the 5-dot "stars" commonality indicator.
