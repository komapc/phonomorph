const fs = require('fs');
const path = require('path');

const TRANS_DIR = path.join(__dirname, 'public/data/transformations');
const files = fs.readdirSync(TRANS_DIR).filter(f => f.endsWith('.json'));

files.forEach(file => {
  const filePath = path.join(TRANS_DIR, file);
  let content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  let changed = false;

  // Fix missing tags field
  if (!content.tags) {
    content.tags = [];
    changed = true;
  }

  // Add Allophony tag if isAllophone is true
  if (content.isAllophone === true) {
    if (!content.tags.includes('Allophony')) {
      content.tags.unshift('Allophony');
      changed = true;
    }
  }

  // Ensure tags are an array
  if (!Array.isArray(content.tags)) {
    content.tags = [content.tags];
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, JSON.stringify(content, null, 2));
    console.log(`Fixed ${file}`);
  }
});
