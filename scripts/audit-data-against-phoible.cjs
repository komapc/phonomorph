const fs = require('fs');
const path = require('path');

/**
 * audit-data-against-phoible.cjs (Allophone-Aware Audit)
 */

const CACHE_FILE = path.join(__dirname, '../.cache/phoible.csv');
const TRANS_DIR = path.join(__dirname, '../public/data/transformations');

function parseCsvLine(line) {
  const result = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') inQuotes = !inQuotes;
    else if (char === ',' && !inQuotes) { result.push(cur); cur = ''; }
    else cur += char;
  }
  result.push(cur);
  return result;
}

function getBaseIPA(ipa) {
  return ipa
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[ː̪̰̤̥̩̯̞̃ˠ̠˖˗˞]/g, '')
    .replace(/[\[\]]/g, '')
    .trim();
}

async function loadPhoible() {
  if (!fs.existsSync(CACHE_FILE)) throw new Error("PHOIBLE cache not found.");
  const data = fs.readFileSync(CACHE_FILE, 'utf8');
  const lines = data.split('\n');
  const headers = parseCsvLine(lines[0]);
  
  const phonemeIdx = headers.indexOf('Phoneme');
  const allophonesIdx = headers.indexOf('Allophones');
  const langNameIdx = headers.indexOf('LanguageName');
  const isoIdx = headers.indexOf('ISO6393');

  const langInventories = {};
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const row = parseCsvLine(lines[i]);
    const name = row[langNameIdx].toLowerCase();
    const iso = row[isoIdx].toLowerCase();
    
    if (!langInventories[name]) langInventories[name] = new Set();
    if (!langInventories[iso]) langInventories[iso] = new Set();
    
    // Add phoneme
    const phoneme = row[phonemeIdx].trim();
    langInventories[name].add(phoneme);
    langInventories[iso].add(phoneme);
    langInventories[name].add(getBaseIPA(phoneme));
    langInventories[iso].add(getBaseIPA(phoneme));

    // Add allophones
    if (allophonesIdx !== -1 && row[allophonesIdx]) {
      const allophones = row[allophonesIdx].split(' ');
      for (let allo of allophones) {
        allo = allo.trim();
        if (!allo) continue;
        langInventories[name].add(allo);
        langInventories[iso].add(allo);
        langInventories[name].add(getBaseIPA(allo));
        langInventories[iso].add(getBaseIPA(allo));
      }
    }
  }
  return langInventories;
}

async function main() {
  try {
    const inventories = await loadPhoible();
    const files = fs.readdirSync(TRANS_DIR).filter(f => f.endsWith('.json'));
    
    console.log(`Auditing ${files.length} transformations (Allophone-Aware)...\n`);
    
    let totalIssues = 0;
    let missingLangs = new Set();
    const report = [];

    for (const file of files) {
      const trans = JSON.parse(fs.readFileSync(path.join(TRANS_DIR, file), 'utf8'));
      if (!trans.languageExamples) continue;

      for (const entry of trans.languageExamples) {
        const words = entry.language.split(' ');
        const langName = words[words.length - 1].toLowerCase();
        if (langName.startsWith('proto-')) continue;

        const inventory = inventories[langName];
        if (!inventory) {
          missingLangs.add(entry.language);
          continue;
        }

        if (entry.examples && Array.isArray(entry.examples)) {
          for (const ex of entry.examples) {
            const matches = ex.to.match(/\[([^\]\s]{1,3})\]/);
            if (matches) {
              const ipa = matches[1];
              if (ipa === '∅' || !ipa) continue;
              const base = getBaseIPA(ipa);
              
              const found = inventory.has(ipa) || inventory.has(base);
              
              if (!found) {
                const alt = ipa.replace(/tʃ/g, 't̠ʃ').replace(/dʒ/g, 'd̠ʒ');
                if (!inventory.has(alt)) {
                  report.push(`${file}: ${entry.language} missing [${ipa}]`);
                  totalIssues++;
                }
              }
            }
          }
        }
      }
    }
    
    if (missingLangs.size > 0) {
      console.log(`--- Languages not found in PHOIBLE (${missingLangs.size}) ---`);
      console.log([...missingLangs].sort().join(', '));
      console.log('\n');
    }

    const uniqueReport = [...new Set(report)].sort();
    if (uniqueReport.length > 0) {
      console.log(`--- Potential Data Errors (${uniqueReport.length}) ---`);
      uniqueReport.forEach(line => console.warn(`[!] ${line}`));
    }

    console.log(`\nAudit complete.`);
    console.log(`Found ${totalIssues} high-signal phoneme discrepancies.`);
  } catch (err) {
    console.error("Error:", err.message);
  }
}

main();
