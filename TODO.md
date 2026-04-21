# EchoDrift TODO

## High Priority: Data Gaps
- [x] **Fill the remaining matrix holes**: Research and document the [ʌ]↔[y] shift (conquered via Scottish Gaelic attenuation and Bashkir rounding harmony).
- [x] **Retroflex Audit**: Identify and fill missing holes in the retroflex consonant sub-matrix. (Added ʈ → ʈʂ and ɖ → ɽ)
- [ ] **Rare Shifts**: Add more language examples and academic citations for shifts with commonality < 2.

## Maintenance & Infrastructure
- [ ] **PHOIBLE Integration**:
    - [x] **Phase 1: Data Acquisition**: Manually download PHOIBLE CSV to `.cache/phoible.csv` to bypass GitHub rate limits.
    - [x] **Phase 2: Data Audit**: Run `node scripts/audit-data-against-phoible.cjs` to verify transformation examples. (Audited 1680 transformations, established high-signal baseline).
    - [x] **Phase 3: Gap Research**: Successfully used PHOIBLE leads to resolve [ʌ]↔[y] and retroflex gaps.
    - [ ] **Phase 4: Global Coverage**: Implement a geographic view based on PHOIBLE's language coordinates.
- [x] **Continuous Audit**: Periodically verify that all external academic links are still active.
- [ ] **Community Workflow**: Create a `CONTRIBUTING.md` with a clear schema for user-submitted transformations.
- [x] **Validation Script**: Enhance `scripts/validate-links.ts` to check for 404s on source URLs.

## Optimization & Code Quality
- [x] ⭐ **CI Validation**: Add a GitHub Action to run `validate-links.ts` and JSON schema checks on every PR.
- [ ] ⭐ **Fuzzy Search**: Integrate `Fuse.js` for better "Instant Search" matching (handles typos and partials).
- [x] ⭐ **Structured Data**: Add JSON-LD (Dataset/ScholarlyArticle) to transformation pages for academic SEO.
- [x] ⭐ **Script Modernization**: Transition `.cjs` utility scripts to TypeScript (using `tsx`).
- [x] **Sharded Indexing**: Split `index.json` into shards to improve initial load performance.
- [x] **Feature-Based Search**: Allow filtering matrix and search by phonetic features (e.g., `[+aspirated]`).
- [x] **Testing Suite**: Implement Vitest for data logic and Playwright for keyboard navigation testing.
- [ ] **Service Worker**: Use Workbox for prefetching transformation data on hover.

## Future Features
- [ ] **Map Visualization**: Add a geographic view showing the distribution of specific phonetic shifts across the globe.
- [ ] **Command Palette**: Implement a `Cmd+K` interface for rapid navigation between symbols.
- [ ] **Dynamic OG Images**: Generate custom social preview images for individual shifts.
- [ ] **User Contributions**: Implement a "Propose Shift" form that generates a pre-formatted JSON for GitHub Pull Requests.

---
*⭐ = Selected as "Most Simple" high-impact tasks.*
