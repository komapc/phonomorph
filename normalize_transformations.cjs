const fs = require('fs');
const path = require('path');

const TRANS_DIR = path.join(__dirname, 'public/data/transformations');
const files = fs.readdirSync(TRANS_DIR).filter(f => f.endsWith('.json'));

console.log(`Normalizing ${files.length} files...`);

files.forEach(file => {
  const filePath = path.join(TRANS_DIR, file);
  let content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  let changed = false;

  // Normalize fromId/toId
  if (content.from && !content.fromId) {
    content.fromId = content.from;
    delete content.from;
    changed = true;
  }
  if (content.to && !content.toId) {
    content.toId = content.to;
    delete content.to;
    changed = true;
  }

  // Normalize preamble
  if (content.description && !content.preamble) {
    content.preamble = content.description;
    delete content.description;
    changed = true;
  }

  // Normalize languageExamples
  if (content.languages && !content.languageExamples) {
    // If it's the old array format, map it
    content.languageExamples = content.languages.map(l => {
      if (l.examples && Array.isArray(l.examples)) {
        return {
          language: l.language,
          languageFamily: l.languageFamily || (l.native ? 'Native' : 'Loan'),
          examples: l.examples.map(ex => ({
            from: ex.orthography || ex.from || '',
            to: ex.ipa || ex.to || '',
            note: ex.gloss || ex.description || ex.note || ''
          }))
        };
      }
      return l;
    });
    delete content.languages;
    changed = true;
  }

  // Fallback for phoneticEffects (used for naming in index)
  if (!content.phoneticEffects) {
    if (content.name) {
      content.phoneticEffects = content.name;
    } else if (content.preamble) {
      // Extract first meaningful word from preamble if phoneticEffects is missing
      const firstPart = content.preamble.split(/[.,]/)[0];
      content.phoneticEffects = firstPart.includes('shift') ? 'Shift' : firstPart.split(' ').slice(0, 3).join(' ');
    } else {
      content.phoneticEffects = 'Shift';
    }
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, JSON.stringify(content, null, 2));
  }
});

console.log('Normalization complete. Now rebuild index.');
