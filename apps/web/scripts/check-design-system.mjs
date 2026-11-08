import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { extname, resolve } from 'node:path';

const root = process.cwd();
const requiredPaths = [
  'src/app/pages/design-system/design-system-page.component.ts',
  'src/app/pages/design-system/design-system-page.component.html',
  'src/app/pages/design-system/design-system-page.component.scss',
  '../../packages/design-system/_foundations.scss'
];
const errors = [];

for (const path of requiredPaths) {
  if (!existsSync(resolve(root, path))) errors.push(`Missing design-system asset: ${path}`);
}

for (const relativeRoot of ['src/app', 'src/styles']) {
  for (const path of walk(resolve(root, relativeRoot))) {
    if (!['.ts', '.html', '.scss'].includes(extname(path))) continue;
    const source = readFileSync(path, 'utf8');
    const checks = [
      ['Catalist', /\bCatalist\b/],
      ['usecatalist.com', /usecatalist\.com/],
      ['legacy collection route', /\/collections\b/]
    ];

    for (const [label, pattern] of checks) {
      if (pattern.test(source)) errors.push(`${label} remains in ${path.replace(`${root}/`, '')}`);
    }
  }
}

if (errors.length) {
  console.error('Design-system audit failed:\n');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Design-system audit passed: foundations, route, and legacy-boundary checks are clean.');

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    return entry.isDirectory() ? walk(path) : path;
  });
}
