import { describe, it, expect } from 'vitest';
import { languageNames } from './languageNames';

describe('languageNames', () => {
  it.each([
    ['Icelandic', ['Icelandic']],
    ['Swabian (Horb)', ['Swabian']],
    ['English (Received Pronunciation)', ['English']],
    ['Proto-Nakh to Ingush', ['Ingush']],
    ['Latin to French', ['French']],
    ['Latin to Italian/French', ['Italian', 'French']],
    ['Proto-East-Cushitic to Oromo, Konso and Arbore', ['Oromo', 'Konso', 'Arbore']],
    ['Proto-Polynesian to Hawaiian / Rapa Nui / Māori', ['Hawaiian', 'Rapa Nui', 'Māori']],
    ['Proto-Dravidian to Kurukh', ['Kurukh']],
    ['Middle Chinese to Southwestern Mandarin (Sichuanese)', ['Southwestern Mandarin']],
    ['Classical Japanese to Japanese (Kagoshima / Satsugū dialect)', ['Japanese']],
    ['Romance (Latin to Italian)', ['Romance']],
    ['Avestan and Persian (Proto-Iranian)', ['Avestan', 'Persian']],
    ['Huanca (Wanka) Quechua', ['Huanca Quechua']],
    ['Arabic loans in Turkish', ['Turkish']],
    ['Pali/Sanskrit loanwords in Thai', ['Thai']],
    ['English dialects (New York City, Sheffield, Inland North)', ['English']],
    ['Proto-Mixtec to Mixtec varieties', ['Mixtec']],
    ['Nuu-chah-nulth m̓ ~ Makah b (correspondence)', ['Makah']],
    ['Downriver Halkomelem y̓ ~ Upriver Halkomelem y (correspondence)', ['Upriver Halkomelem']],
    ['Circassian: Hakuchi Shapsug qʼ ~ Adyghe and Kabardian ʔ (correspondence)', ['Adyghe', 'Kabardian']],
    ['Hausa: Standard ƙ [kʼ] ~ East Hausa (Azare) ʔ (correspondence)', ['Hausa']],
    ['Haikou (Hainanese)', ['Hainanese']],
    ['Japanese (Late Middle Japanese)', ['Late Middle Japanese']],
    ['Eastern and Central Arrernte', ['Eastern Arrernte', 'Central Arrernte']],
    ['Proto-Samic (from Proto-Uralic), unstressed syllables', ['Proto-Samic']],
    ['Old Polish (mazurated forms kept in Standard Polish)', ['Polish']],
    ['Mandarin (coda -m)', ['Mandarin Chinese']],
    ['Mandarin Chinese (Standard)', ['Mandarin Chinese']],
    ['Megrelian', ['Mingrelian']],
    ['Proto-Kartvelian to Mingrelian and Laz', ['Mingrelian', 'Laz']],
  ])('%s → %j', (raw, want) => expect(languageNames(raw)).toEqual(want));
});
