// Structural validation of public/data/transformations/*.json.
// Usage: npx tsx scripts/validate-schema.ts [--warn-only]
//
// Errors (exit 1): unparsable JSON, missing/ill-typed required fields,
// out-of-range certainty/commonality, fromId/toId not matching the filename,
// cell isAllophone disagreeing with the per-entry isAllophone flags.
// Warnings (never fail): no sources, or no language examples.
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIR = path.join(__dirname, '../public/data/transformations');

type Json = Record<string, unknown>;

const isStr = (v: unknown): v is string => typeof v === 'string' && v.length > 0;
const isInt1to5 = (v: unknown) => typeof v === 'number' && Number.isInteger(v) && v >= 1 && v <= 5;

export function validate(file: string, j: Json): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!isStr(j.fromId)) errors.push('fromId must be a non-empty string');
  if (!isStr(j.toId)) errors.push('toId must be a non-empty string');
  if (isStr(j.fromId) && isStr(j.toId) && file !== `${j.fromId}_to_${j.toId}.json`) {
    errors.push(`filename does not match ids (${j.fromId}_to_${j.toId}.json)`);
  }
  if (!isStr(j.preamble)) errors.push('preamble must be a non-empty string');
  if (!isInt1to5(j.certainty)) errors.push('certainty must be an integer 1-5');
  if (!isInt1to5(j.commonality)) errors.push('commonality must be an integer 1-5');
  if (j.tags !== undefined && !(Array.isArray(j.tags) && j.tags.every(isStr))) {
    errors.push('tags must be an array of strings');
  }
  if (!Array.isArray(j.sources) || !j.sources.every(isStr)) {
    errors.push('sources must be an array of strings');
  } else if (j.sources.length === 0) {
    warnings.push('no sources');
  }

  if (!Array.isArray(j.languageExamples)) {
    errors.push('languageExamples must be an array');
  } else {
    if (j.languageExamples.length === 0) warnings.push('no language examples');
    j.languageExamples.forEach((le: Json, i: number) => {
      if (!isStr(le?.language)) errors.push(`languageExamples[${i}].language missing`);
      if (!Array.isArray(le?.examples)) errors.push(`languageExamples[${i}].examples must be an array`);
      if (le?.isAllophone !== undefined && typeof le.isAllophone !== 'boolean') {
        errors.push(`languageExamples[${i}].isAllophone must be a boolean`);
      }
    });
    // The cell flag is derived: true exactly when some entry is allophonic
    const anyAllophone = (j.languageExamples as Json[]).some(le => le?.isAllophone === true);
    if (anyAllophone !== (j.isAllophone === true)) {
      errors.push(anyAllophone
        ? 'an entry has isAllophone but the cell lacks isAllophone: true'
        : 'isAllophone: true but no languageExamples entry has isAllophone: true');
    }
  }

  if (j.related !== undefined) {
    if (!Array.isArray(j.related)) errors.push('related must be an array');
    else (j.related as Json[]).forEach((r, i) => {
      if (!isStr(r?.fromId) || !isStr(r?.toId)) errors.push(`related[${i}] needs fromId and toId`);
      else if (!EXISTING.has(`${r.fromId}_to_${r.toId}`)) errors.push(`related[${i}] points to missing transformation ${r.fromId}_to_${r.toId}`);
    });
  }
  return { errors, warnings };
}

const EXISTING = new Set(fs.readdirSync(DIR).filter(f => f.endsWith('.json')).map(f => f.slice(0, -5)));

function main() {
  const warnOnly = process.argv.includes('--warn-only');
  let errCount = 0;
  let warnCount = 0;
  for (const file of fs.readdirSync(DIR).filter(f => f.endsWith('.json')).sort()) {
    let json: Json;
    try {
      json = JSON.parse(fs.readFileSync(path.join(DIR, file), 'utf8'));
    } catch (e) {
      console.error(`ERROR ${file}: invalid JSON (${(e as Error).message})`);
      errCount++;
      continue;
    }
    const { errors, warnings } = validate(file, json);
    errors.forEach(m => console.error(`ERROR ${file}: ${m}`));
    warnings.forEach(m => console.warn(`warn  ${file}: ${m}`));
    errCount += errors.length;
    warnCount += warnings.length;
  }
  console.log(`\nSchema check: ${errCount} error(s), ${warnCount} warning(s)`);
  if (errCount > 0 && !warnOnly) process.exit(1);
}

main();
