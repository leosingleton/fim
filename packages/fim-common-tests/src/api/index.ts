// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { fimTestSuiteCanvas } from './Canvas';
import { fimTestSuiteCreateDispose } from './CreateDispose';
import { fimTestSuitePngJpeg } from './PngJpeg';
import { fimTestSuiteShaders } from './Shaders';
import { fimTestSuiteWebGL } from './WebGL';
import { fimTestSuiteWebGLContextLost } from './WebGLContextLost';
import { Fim, FimDimensions } from '@leosingleton/fim';

/**
 * Executes a suite of common tests using the FIM client created via factory methods
 * @param description Description to show in the test framework
 * @param factory Lambda to call FimXYZFactory.create()
 */
export function fimTestSuite(
  description: string,
  factory: (maxImageDimensions: FimDimensions) => Fim
): void {
  fimTestSuiteCreateDispose(description, factory);
  fimTestSuiteCanvas(description, factory);
  fimTestSuitePngJpeg(description, factory);
  fimTestSuiteWebGL(description, factory);
  fimTestSuiteWebGLContextLost(description, factory);
  fimTestSuiteShaders(description, factory);
}
