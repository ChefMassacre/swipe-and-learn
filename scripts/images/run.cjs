// Starts an image script with the right Node.js settings, and explains
// clearly if this computer's Node.js is too old.
//   node scripts/images/run.cjs fetch|clean|review|normalize [options]
const { spawnSync } = require('node:child_process');
const path = require('node:path');

const [major, minor] = process.versions.node.split('.').map(Number);
if (major < 22 || (major === 22 && minor < 6)) {
  console.error(
    `\nThese image tools need Node.js 22 or newer, and this computer has Node.js ${process.versions.node}.\n` +
      'Install the "LTS" version from https://nodejs.org, close this window, open a new one, and try again.\n',
  );
  process.exit(1);
}

const [step, ...rest] = process.argv.slice(2);
if (!['fetch', 'clean', 'review', 'normalize'].includes(step)) {
  console.error('Usage: npm run images:fetch | images:clean | images:review | images:normalize');
  process.exit(1);
}

// Node 22.6 to 23.5 need a flag to read TypeScript files; newer versions do it by default.
const needsFlag = major === 22 || (major === 23 && minor < 6);
const args = [...(needsFlag ? ['--experimental-strip-types'] : []), '--no-warnings', path.join(__dirname, `${step}.mjs`), ...rest];
const r = spawnSync(process.execPath, args, { stdio: 'inherit' });
process.exit(r.status ?? 1);
