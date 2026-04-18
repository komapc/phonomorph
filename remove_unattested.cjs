const fs = require('fs');
const path = '/home/mark/projects/a2a/public/data/unattested.json';

const unattested = JSON.parse(fs.readFileSync(path, 'utf8'));
const toRemove = [
  "caret_to_y",
  "y_to_caret"
];

const initialCount = unattested.length;
const filtered = unattested.filter(id => !toRemove.includes(id));
const finalCount = filtered.length;

console.log(`Removed ${initialCount - finalCount} items from unattested.`);

fs.writeFileSync(path, JSON.stringify(filtered, null, 2));
