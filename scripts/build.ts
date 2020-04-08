// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

'use strict';

import path from 'path';
import cp from 'child_process';
import glob from 'glob';

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
    const cwd = path.resolve(packagesDir, pkg);
    console.log(cwd);
    let stdout = '';

    // Find and minify .glsl files
    stdout += minifyGlsl(cwd);

    // Compile TypeScript
    stdout += compileCommonJS(cwd);

    console.log(stdout);
  } catch (err) {
    console.log(err.stdout);
    process.exit(-1);
  }
}

/**
 * Minifies all .glsl files with the webpack-glsl-minfy compiler
 * @param cwd Current working directory
 * @return Contents of stdout
 */
function minifyGlsl(cwd: string): string {
  let stdout = '';

  const srcDir = path.resolve(cwd, 'src');
  const files = glob.sync('**/*.glsl', { cwd: srcDir });
  for (const file of files) {
    stdout += cp.execSync(`npx webpack-glsl-minify ${file} -o ../build --stripVersion`, { cwd: srcDir });
  }

  return stdout;
}

/**
 * Compiles a package using tsc and generates CommonJS output
 * @param cwd Current working directory
 * @return Contents of stdout
 */
function compileCommonJS(cwd: string): string {
  return cp.execSync('npx tsc', { cwd }).toString();
}
