const fs = require('fs');
const index = JSON.parse(fs.readFileSync('/home/mark/projects/a2a/public/data/index.json', 'utf8'));
const unattested = index.unattested;

const candidates = [
  'p_aspirated_to_p',
  't_aspirated_to_t',
  'k_aspirated_to_k',
  'ch_to_t',
  's_to_t',
  'h_to_t',
  'tl_to_t',
  'tl_to_l',
  'l_fricative_to_l',
  'glottal_stop_to_empty',
  'n_to_ng',
  'l_to_r',
  'k_to_ts',
  'm_to_w',
  'ng_to_k',
  'n_to_r',
  'p_to_b',
  't_to_d',
  'k_to_g',
  'p_to_phi',
  't_to_th_vless',
  'k_to_x'
];

const found = candidates.filter(c => unattested.includes(c));
console.log('Found in unattested:', found);

// Let's also find some other interesting ones from unattested
const eastAsianPlausible = unattested.filter(id => {
    return id.includes('ng_to') || id.includes('n_to') || id.includes('l_to') || id.includes('r_to') || id.includes('sh_to') || id.includes('zh_to') || id.includes('j_to');
}).slice(0, 10);

console.log('East Asian Plausible:', eastAsianPlausible);

const nativeAmericanPlausible = unattested.filter(id => {
    return id.includes('tl_to') || id.includes('l_fricative_to') || id.includes('q_to') || id.includes('glottal_stop_to') || id.includes('x_uvular_to');
}).slice(0, 10);

console.log('Native American Plausible:', nativeAmericanPlausible);
