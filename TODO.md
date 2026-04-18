# EchoDrift TODO

## High Priority: Data Gaps
- [x] **Fill the remaining matrix holes**: Research and document the [ʌ]↔[y] shift (conquered via Scottish Gaelic attenuation and Bashkir rounding harmony).
- [x] **Retroflex Audit**: Identify and fill missing holes in the retroflex consonant sub-matrix. (Added ʈ → ʈʂ and ɖ → ɽ)
- [ ] **Rare Shifts**: Add more language examples and academic citations for shifts with commonality < 2.

## Maintenance & Infrastructure
- [ ] **PHOIBLE Integration**:
    - [x] **Phase 1: Data Acquisition**: Manually download PHOIBLE CSV to `.cache/phoible.csv` to bypass GitHub rate limits.
    - [x] **Phase 2: Data Audit**: Run `node scripts/audit-data-against-phoible.cjs` to verify transformation examples. (Audited 1680 transformations, established high-signal baseline).
    - [ ] **Phase 3: Gap Research**: Use `npm run find-candidates` to locate languages containing both [ʌ] and [y] for targeted research.
    - [ ] **Phase 4: Global Coverage**: Implement a geographic view based on PHOIBLE's language coordinates.
- [ ] **Continuous Audit**: Periodically verify that all external academic links are still active.
- [ ] **Community Workflow**: Create a `CONTRIBUTING.md` with a clear schema for user-submitted transformations.
- [ ] **Validation Script**: Enhance `scripts/validate-links.cjs` to check for 404s on source URLs.

## Future Features
- [ ] **Map Visualization**: Add a geographic view showing the distribution of specific phonetic shifts across the globe.
- [ ] **User Contributions**: Implement a "Propose Shift" form that generates a pre-formatted JSON for GitHub Pull Requests.
