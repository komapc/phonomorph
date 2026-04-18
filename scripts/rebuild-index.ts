import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import type { IPASymbol, Transformation, IPASymbolMeta, TransformationMeta, DataManifest } from '../src/data/loader';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../public/data');
const UNATTESTED_FILE = path.join(DATA_DIR, 'unattested.json');
const SHARDS_DIR = path.join(DATA_DIR, 'shards');
const INDEX_FILE = path.join(DATA_DIR, 'index.json');

const TRANS_SHARD_SIZE = 500;
const UNATTESTED_SHARD_SIZE = 1500;

function shardArray<T>(array: T[], size: number): T[][] {
  const shards: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    shards.push(array.slice(i, i + size));
  }
  return shards;
}

/**
 * Bundles transformation metadata into shards and creates a manifest index.json.
 * This avoids a single massive fetch for all atlas data.
 */
function rebuild() {
  console.log('--- Rebuilding PhonoMorph Index (Sharded TS) ---');

  try {
    if (!fs.existsSync(SHARDS_DIR)) {
      fs.mkdirSync(SHARDS_DIR, { recursive: true });
    }

    // 1. Get Symbols
    const symbolsDir = path.join(DATA_DIR, 'symbols');
    const symbolFiles = fs.readdirSync(symbolsDir).filter(f => f.endsWith('.json'));

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

    // 2. Get Transformations
    const transformationsDir = path.join(DATA_DIR, 'transformations');
    const transFiles = fs.readdirSync(transformationsDir).filter(f => f.endsWith('.json'));

    let totalExamples = 0;
    const totalSources = new Set<string>();
    let totalAllophones = 0;
    const families = new Set<string>();
    const languages = new Set<string>();

    const transformations: TransformationMeta[] = transFiles.map(file => {
      const content = JSON.parse(fs.readFileSync(path.join(transformationsDir, file), 'utf8')) as Transformation;
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
      if (isAllophone) totalAllophones++;

      return {
        id: file.replace('.json', ''),
        name: (content.phoneticEffects || '').split(',')[0].trim() || 'SHIFT',
        commonality: content.commonality || 1,
        isAllophone: isAllophone,
        languages: Array.from(new Set(shiftLanguages)),
        tags: content.tags || []
      };
    }).sort((a, b) => a.id.localeCompare(b.id));

    // 3. Persist Unattested pairs
    let unattested: string[] = [];
    if (fs.existsSync(UNATTESTED_FILE)) {
      unattested = JSON.parse(fs.readFileSync(UNATTESTED_FILE, 'utf8'));
    }

    // 4. Create Shards
    const transShards = shardArray(transformations, TRANS_SHARD_SIZE);
    const unattestedShards = shardArray(unattested, UNATTESTED_SHARD_SIZE);

    const transShardFiles = transShards.map((shard, i) => {
      const fileName = `transformations-${i + 1}.json`;
      fs.writeFileSync(path.join(SHARDS_DIR, fileName), JSON.stringify(shard));
      return fileName;
    });

    const unattestedShardFiles = unattestedShards.map((shard, i) => {
      const fileName = `unattested-${i + 1}.json`;
      fs.writeFileSync(path.join(SHARDS_DIR, fileName), JSON.stringify(shard));
      return fileName;
    });

    // 5. Create Manifest
    const manifest: DataManifest = {
      symbols,
      stats: {
        totalExamples,
        totalSources: totalSources.size,
        totalAllophones,
        families: Array.from(families).sort(),
        languages: Array.from(languages).sort()
      },
      shards: {
        transformations: transShardFiles,
        unattested: unattestedShardFiles
      }
    };

    fs.writeFileSync(INDEX_FILE, JSON.stringify(manifest, null, 2));
    
    console.log(`✅ Success! Sharded ${symbols.length} symbols, ${transformations.length} transformations, and ${unattested.length} unattested.`);
    console.log(`📦 Created ${transShardFiles.length} transformation shards and ${unattestedShardFiles.length} unattested shards.`);
    console.log(`📍 Manifest: ${INDEX_FILE}`);
  } catch (err) {
    console.error('❌ Failed to rebuild index:', err);
    process.exit(1);
  }
}

rebuild();
