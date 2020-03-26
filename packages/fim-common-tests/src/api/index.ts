// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { fimTestSuiteCanvas } from './Canvas';
import { fimTestSuiteCreateDispose } from './CreateDispose';
import { fimTestSuiteImage } from './Image';
import { fimTestSuiteOpBrightnessContrast } from './OpBrightnessContrast';
import { fimTestSuiteOpBuiltin } from './OpBuiltin';
import { fimTestSuiteOpDownscale } from './OpDownscale';
import { fimTestSuiteOperation } from './Operation';
import { fimTestSuiteOpGaussianBlur } from './OpGaussianBlur';
import { fimTestSuiteOversized } from './Oversized';
import { fimTestSuitePngJpeg } from './PngJpeg';
import { fimTestSuiteResourceTracker } from './ResourceTracker';
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
  fimTestSuiteImage(description, factory);
  fimTestSuiteCanvas(description, factory);
  fimTestSuitePngJpeg(description, factory);
  fimTestSuiteWebGL(description, factory);
  fimTestSuiteWebGLContextLost(description, factory);
  fimTestSuiteOperation(description, factory);
  fimTestSuiteOpBuiltin(description, factory);
  fimTestSuiteOpBrightnessContrast(description, factory);
  fimTestSuiteOpDownscale(description, factory);
  fimTestSuiteOpGaussianBlur(description, factory);
  fimTestSuiteOversized(description, factory);
  fimTestSuiteResourceTracker(description, factory);
}
