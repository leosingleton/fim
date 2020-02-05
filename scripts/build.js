'use strict';

const path = require('path');
const cp = require('child_process');

/** NPM packages, in build order */
const packages = [
  'fim',
  'fim-browser',
  'fim-node'
];

const packagesDir = path.resolve(__dirname, '../packages');

for (const pkg of packages) {
  try {
    const workingDir = path.resolve(packagesDir, pkg);
    console.log(workingDir);
    const stdout = cp.execSync('npx tsc', { cwd: workingDir });
    console.log(stdout.toString());
  } catch (err) {
    console.log(err.stdout.toString());
    process.exit(-1);
  }
}
