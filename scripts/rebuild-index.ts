import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import type { IPASymbol, Transformation, DataIndex, IPASymbolMeta, TransformationMeta } from '../src/data/loader';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../public/data');
const INDEX_FILE = path.join(DATA_DIR, 'index.json');

/**
 * Bundles transformation metadata into index.json to avoid thousands of individual fetches.
 * This runs before dev and build.
 */
function rebuild() {
  console.log('--- Rebuilding PhonoMorph Index (TS) ---');

  try {
    // 1. Get Symbols with metadata from the symbols directory
    const symbolsDir = path.join(DATA_DIR, 'symbols');
    const symbolFiles = fs.readdirSync(symbolsDir)
      .filter(f => f.endsWith('.json'));

    const symbols: IPASymbolMeta[] = symbolFiles.map(file => {
      const content = JSON.parse(fs.readFileSync(path.join(symbolsDir, file), 'utf8')) as IPASymbol;
      return {
        id: file.replace('.json', ''),
        symbol: content.symbol,
        name: content.name,
        category: content.category,
        manner: content.manner,
        place: content.place,
        height: content.height,
        backness: content.backness,
        family: content.family,
        isExotic: !!content.isExotic,
        isPalatalized: !!content.isPalatalized,
        isNasalized: !!content.isNasalized,
        isDiphthong: !!content.isDiphthong,
        isAspirated: !!content.isAspirated
      };
    }).sort((a, b) => a.id.localeCompare(b.id));

    // 2. Get Transformations with Metadata
    const transformationsDir = path.join(DATA_DIR, 'transformations');
    const transFiles = fs.readdirSync(transformationsDir)
      .filter(f => f.endsWith('.json'));

    let totalExamples = 0;
    const totalSources = new Set<string>();
    let totalAllophones = 0;
    const families = new Set<string>();
    const languages = new Set<string>();

    const transformations: TransformationMeta[] = transFiles.map(file => {
      const content = JSON.parse(fs.readFileSync(path.join(transformationsDir, file), 'utf8')) as Transformation;
      
      // Calculate Stats
      const examples = content.languageExamples || [];
      const shiftLanguages: string[] = [];
      
      examples.forEach(le => {
        totalExamples += (le.examples || []).length;
        if (le.languageFamily) families.add(le.languageFamily);
        if (le.language) {
          const lang = le.language.trim();
          languages.add(lang);
          shiftLanguages.push(lang);
        }
      });
      
      (content.sources || []).forEach(s => totalSources.add(s));

      const isAllophone = content.isAllophone === true;
      if (isAllophone) {
        totalAllophones++;
      }

      return {
        id: file.replace('.json', ''),
        name: (content.phoneticEffects || '').split(',')[0].trim() || 'SHIFT',
        commonality: content.commonality || 1,
        isAllophone: isAllophone,
        languages: Array.from(new Set(shiftLanguages)),
        tags: content.tags || []
      };
    }).sort((a, b) => a.id.localeCompare(b.id));

    // 3. Persist Unattested pairs (read from current index)
    let unattested: string[] = [];
    if (fs.existsSync(INDEX_FILE)) {
      const currentIndex = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf8')) as DataIndex;
      unattested = currentIndex.unattested || [];
    }

    const newIndex: DataIndex = {
      symbols,
      transformations,
      unattested,
      stats: {
        totalExamples,
        totalSources: totalSources.size,
        totalAllophones,
        families: Array.from(families).sort(),
        languages: Array.from(languages).sort()
      }
    };

    fs.writeFileSync(INDEX_FILE, JSON.stringify(newIndex, null, 2));
    
    console.log(`✅ Success! Bundled ${symbols.length} symbols and ${transformations.length} transformations.`);
    console.log(`📊 Stats: ${totalExamples} examples, ${totalSources.size} sources, ${totalAllophones} allophones, ${families.size} families, ${languages.size} languages.`);
    console.log(`📍 File: ${INDEX_FILE}`);
  } catch (err) {
    console.error('❌ Failed to rebuild index:', err);
    process.exit(1);
  }
}

rebuild();
