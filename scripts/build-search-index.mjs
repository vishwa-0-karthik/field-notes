import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';

const sourceDir = new URL('../src/data/deep/', import.meta.url);
const publicDir = new URL('../public/', import.meta.url);
const outputFile = new URL('../public/deep-search.json', import.meta.url);
const entries = readdirSync(sourceDir)
  .filter((name) => name.endsWith('.md'))
  .sort()
  .map((name) => [name.slice(0, -3), readFileSync(new URL(name, sourceDir), 'utf8')]);

mkdirSync(publicDir, { recursive: true });
writeFileSync(outputFile, `${JSON.stringify(Object.fromEntries(entries))}\n`);
console.log(`Indexed ${entries.length} expanded lessons for on-demand full-text search.`);
