import { existsSync, rmSync, cpSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');
const dest = path.join(root, 'functions', 'public');

if (!existsSync(dist)) {
  console.error('dist/ not found — run `npm run build` first.');
  process.exit(1);
}

rmSync(dest, { recursive: true, force: true });
cpSync(dist, dest, { recursive: true });
console.log(`Copied ${dist} -> ${dest}`);
