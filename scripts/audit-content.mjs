import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const curriculum = JSON.parse(fs.readFileSync(path.join(root, 'src/data/curriculum.json'), 'utf8'));
const lessonDir = path.join(root, 'src/data/deep');
const codes = new Set(curriculum.lessons.map((lesson) => lesson.code));
const files = fs.readdirSync(lessonDir).filter((name) => name.endsWith('.md'));
const errors = [];

for (const name of files) {
  const code = name.slice(0, -3);
  if (!codes.has(code)) errors.push(`${name}: no matching curriculum lesson`);
  const body = fs.readFileSync(path.join(lessonDir, name), 'utf8');
  const prose = body.replace(/^## Sources[\s\S]*$/m, '').replace(/\[[^\]]+\]\([^)]*\)/g, '');
  const words = prose.match(/\b[\w'-]+\b/g)?.length ?? 0;
  const sections = (body.match(/^## /gm) ?? []).length;
  const sources = (body.match(/^- \[[^\]]+\]\(https:\/\/[^)]+\)$/gm) ?? []).length;
  if (words < 500) errors.push(`${name}: ${words} words, minimum 500`);
  if (sections < 4) errors.push(`${name}: ${sections} sections, minimum 4`);
  if (sources < 2) errors.push(`${name}: ${sources} primary source links, minimum 2`);
  if (!body.includes('## Design review')) errors.push(`${name}: missing design review`);
}

const missing = curriculum.lessons.filter((lesson) => !files.includes(`${lesson.code}.md`));
console.log(`${files.length}/${codes.size} expanded lessons; ${missing.length} still have concise notes.`);
if (missing.length) console.log(`Next missing: ${missing.slice(0, 8).map((lesson) => `${lesson.code} ${lesson.title}`).join('; ')}`);
if (process.argv.includes('--require-all') && missing.length) errors.push(`${missing.length} lessons still need expansion`);
if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
}
