// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

'use strict';

const path = require('path');
const cp = require('child_process');
const glob = require('glob');

/** NPM packages, in build order */
const packages = [
  'fim',
  'fim-common-tests',
  'fim-browser',
  'fim-node'
];

const packagesDir = path.resolve(__dirname, '../packages');

for (const pkg of packages) {
  try {
    const workingDir = path.resolve(packagesDir, pkg);
    console.log(workingDir);
    let stdout = '';

    // Find and minify .glsl files
    const srcDir = path.resolve(workingDir, 'src');
    const files = glob.sync('**/*.glsl', { cwd: srcDir });
    for (const file of files) {
      stdout += cp.execSync(`npx webpack-glsl-minify ${file} -o ../build --stripVersion`, { cwd: srcDir });
    }

    // Compile TypeScript
    stdout += cp.execSync('npx tsc', { cwd: workingDir });

    console.log(stdout.toString());
  } catch (err) {
    console.log(err.stdout.toString());
    process.exit(-1);
  }
}
