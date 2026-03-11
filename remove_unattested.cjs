const fs = require('fs');
const path = '/home/mark/projects/a2a/public/data/index.json';

const data = JSON.parse(fs.readFileSync(path, 'utf8'));
const toRemove = [
  "h_to_phi",
  "g_to_ng",
  "s_to_l_fricative",
  "k_to_kl",
  "t_to_kl",
  "tl_to_phi",
  "tl_to_ts",
  "tl_to_ch",
  "tl_to_l_fricative",
  "tl_to_k"
];

const initialCount = data.unattested.length;
data.unattested = data.unattested.filter(id => !toRemove.includes(id));
const finalCount = data.unattested.length;

console.log(`Removed ${initialCount - finalCount} items from unattested.`);

fs.writeFileSync(path, JSON.stringify(data, null, 2));
