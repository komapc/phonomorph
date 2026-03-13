const fs = require('fs');
const path = require('path');

const files = [
  'b_to_p.json',
  'd_to_t.json',
  'empty_to_glottal_stop.json',
  'g_to_k.json',
  'glottal_stop_to_empty.json',
  'h_to_empty.json',
  'j_affricate_to_ch.json',
  'p_to_glottal_stop.json',
  's_to_h.json',
  'z_to_s.json'
];

files.forEach(file => {
  const filePath = path.join('public/data/transformations', file);
  const content = fs.readFileSync(filePath, 'utf8');
  
  const headMatch = content.match(/<<<<<<< HEAD([\s\S]*?)=======/);
  const masterMatch = content.match(/=======([\s\S]*?)>>>>>>> master/);
  
  if (!headMatch || !masterMatch) {
    console.log(`Skipping ${file} - no conflict markers found in expected format.`);
    return;
  }

  // This is tricky because the conflict markers are likely around parts of the JSON, not the whole file.
  // Let's try to reconstruct the two versions.
  
  const headVersionStr = content.replace(/<<<<<<< HEAD([\s\S]*?)=======([\s\S]*?)>>>>>>> master/g, '$1');
  const masterVersionStr = content.replace(/<<<<<<< HEAD([\s\S]*?)=======([\s\S]*?)>>>>>>> master/g, '$2');

  let head, master;
  try {
    head = JSON.parse(headVersionStr);
    master = JSON.parse(masterVersionStr);
  } catch (e) {
    console.error(`Failed to parse JSON for ${file}: ${e.message}`);
    return;
  }

  const merged = { ...head };
  merged.preamble = head.preamble; // prefer HEAD

  // Merge phoneticEffects
  const effects = new Set([
    ...(head.phoneticEffects || '').split(',').map(s => s.trim()),
    ...(master.phoneticEffects || '').split(',').map(s => s.trim())
  ].filter(Boolean));
  merged.phoneticEffects = Array.from(effects).join(', ');

  // Merge languageExamples
  const langMap = new Map();
  head.languageExamples.forEach(le => langMap.set(le.language, { ...le }));
  master.languageExamples.forEach(le => {
    if (langMap.has(le.language)) {
      const existing = langMap.get(le.language);
      // Combine examples, avoiding duplicates if they are identical
      le.examples.forEach(newEx => {
        if (!existing.examples.some(ex => JSON.stringify(ex) === JSON.stringify(newEx))) {
          existing.examples.push(newEx);
        }
      });
      // Prefer broader family names
      if (le.languageFamily === 'Austroasiatic' && existing.languageFamily === 'Mon-Khmer') existing.languageFamily = 'Austroasiatic';
      if (le.languageFamily === 'Sino-Tibetan' && existing.languageFamily === 'Sinitic') existing.languageFamily = 'Sino-Tibetan';
    } else {
      langMap.set(le.language, le);
    }
  });
  merged.languageExamples = Array.from(langMap.values());

  // Merge sources
  merged.sources = Array.from(new Set([...(head.sources || []), ...(master.sources || [])]));

  // Merge tags
  merged.tags = Array.from(new Set([...(head.tags || []), ...(master.tags || [])]));

  fs.writeFileSync(filePath, JSON.stringify(merged, null, 2));
  console.log(`Merged ${file}`);
});
