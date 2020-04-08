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
  'fim-node',
  'fim-samples'
];

const packagesDir = path.resolve(__dirname, '../packages');

for (const pkg of packages) {
  try {
    const cwd = path.resolve(packagesDir, pkg);
    console.log(cwd);

    // Read the NPM package configuration
    const config = require(path.resolve(cwd, 'package.json'));

    // Compile and minify .glsl files to JavaScript
    minifyGlsl(cwd);

    // If package.json contains a "main" entry, compile a CommonJS library with tsc
    if (config.main) {
      compileCommonJS(cwd);
    }

    // If package.json contains a "browser" entry, compile a UMD library with Webpack
    if (config.browser) {
      compileUMD(cwd);
    }
  } catch (err) {
    process.stdout.write(err.stdout);
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
    execSyncWrapper(`npx webpack-glsl-minify ${file} -o ../build --stripVersion`, srcDir);
  }
}

/**
 * Compiles a package using tsc and generates CommonJS output
 * @param cwd Current working directory
 */
function compileCommonJS(cwd: string): void {
  execSyncWrapper('npx tsc', cwd);
}

/**
 * Compiles a package using Webpack and generates UMD output
 * @param cwd Current working directory
 */
function compileUMD(cwd: string): void {
  // Build both minified and non-minified versions
  execSyncWrapper('npx webpack --mode=development', cwd);
  execSyncWrapper('npx webpack --mode=production', cwd);
}

/**
 * Wrapper around `child_process.execSync()`
 * @param command Command to execute
 * @param cwd Current working directory
 */
function execSyncWrapper(command: string, cwd: string): void {
  const stdout = cp.execSync(command, { cwd });
  process.stdout.write(stdout);
}
