const fs = require('fs');
const path = '/home/mark/projects/a2a/public/data/index.json';

const data = JSON.parse(fs.readFileSync(path, 'utf8'));
const toRemove = [
  "caret_to_y",
  "y_to_caret"
];

const initialCount = data.unattested.length;
data.unattested = data.unattested.filter(id => !toRemove.includes(id));
const finalCount = data.unattested.length;

console.log(`Removed ${initialCount - finalCount} items from unattested.`);

fs.writeFileSync(path, JSON.stringify(data, null, 2));
