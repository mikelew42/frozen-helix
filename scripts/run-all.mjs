// Run all *.test.js files under public/framework/
import { spawnSync } from 'child_process';
import { readdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..', 'public', 'framework');

// Directories to skip (use different test frameworks)
const SKIP_DIRS = new Set(['game']);

function findTests(dir) {
    const out = [];
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory() && !entry.name.startsWith('.') && !SKIP_DIRS.has(entry.name)) {
            out.push(...findTests(full));
        } else if (entry.name.endsWith('.test.js')) {
            out.push(full);
        }
    }
    return out;
}

const tests = findTests(root);
let passed = 0, failed = 0;

for (const file of tests) {
    const rel = path.relative(process.cwd(), file).split(path.sep).join('/');
    const result = spawnSync(
        process.execPath,
        ['--import', './scripts/register.mjs', file],
        { stdio: 'inherit' }
    );
    if (result.status === 0) {
        passed++;
    } else {
        console.error(`FAILED: ${rel}`);
        failed++;
    }
}

console.log(`\n${tests.length} suites: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
