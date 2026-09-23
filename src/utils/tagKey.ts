// Spelling-insensitive key for a tag: "Vowel Shift", "vowel shift" and
// "Vowel-Shift" all map to "vowelshift". Used by scripts/normalize-tags.ts
// and by the middleware to 301 old hub spellings to the canonical one.
export function tagKey(tag: string): string {
  return tag.toLowerCase().replace(/[^a-z0-9]/g, '');
}
