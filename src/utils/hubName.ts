/**
 * Whether a language, family or process name can have its own static hub page.
 * Names with characters that are awkward in file names or URL path segments
 * get no prerendered page (GitHub Pages would answer 404), so pages show them
 * as plain text instead of linking them. scripts/generate-sitemap.cjs repeats
 * this rule as hubNameOk.
 */
export const hubNameOk = (name: string): boolean =>
  !/[\\/?#%:*"<>|]/.test(name) && !name.startsWith('.') && name.trim() === name;
