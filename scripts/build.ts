// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

'use strict';

import fs from 'fs';
import path from 'path';
import cp from 'child_process';
import glob from 'glob';

/** NPM packages, in build order */
const packages = [
  'fim',
  'fim-common-tests',
  'fim-browser',
  'fim-node',
  'fim-samples'
];

const packagesDir = path.resolve(__dirname, '../packages');

for (const pkg of packages) {
  try {
    const cwd = path.resolve(packagesDir, pkg);
    console.log(cwd);

    minifyGlsl(cwd);
    compileCommonJS(cwd);
    compileUMD(cwd);
  } catch (err) {
    console.log(err.stdout);
    process.exit(-1);
  }
}

/**
 * Minifies all .glsl files with the webpack-glsl-minfy compiler
 * @param cwd Current working directory
 */
function minifyGlsl(cwd: string): void {
  const srcDir = path.resolve(cwd, 'src');
  const files = glob.sync('**/*.glsl', { cwd: srcDir });
  for (const file of files) {
    const stdout = cp.execSync(`npx webpack-glsl-minify ${file} -o ../build --stripVersion`, { cwd: srcDir });
    process.stdout.write(stdout);
  }
}

/**
 * Compiles a package using tsc and generates CommonJS output
 * @param cwd Current working directory
 */
function compileCommonJS(cwd: string): void {
  const stdout = cp.execSync('npx tsc', { cwd });
  process.stdout.write(stdout);
}

/**
 * Compiles a package using Webpack and generates UMD output
 * @param cwd Current working directory
 */
function compileUMD(cwd: string): void {
  // Check whether a Webpack configuration file exists. If not, skip this step.
  if (!fs.existsSync(path.resolve(cwd, 'webpack.config.js'))) {
    console.log(`Skipping UMD bundle for ${path.basename(cwd)} as there is no webpack.config.js`);
    return;
  }

  // Build both minified and non-minified versions
  const stdout = cp.execSync('npx webpack --mode=development && npx webpack --mode=production', { cwd });
  process.stdout.write(stdout);
}
