// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { coreCanvas2DTestSuiteCanvas } from './Canvas';
import { coreCanvas2DTestSuiteCreateDispose } from './CreateDispose';
import { coreCanvas2DTestSuitePngJpeg } from './PngJpeg';
import { FimDimensions } from '@leosingleton/fim';
import { CoreCanvas2D, CoreCanvasOptions } from '@leosingleton/fim/build/internal';

/**
 * Executes a suite of common tests using the CoreCanvas2D objects created via factory methods
 * @param description Description to show in the test framework
 * @param factory Lambda to create the CoreCanvas2D instance
 */
export function coreCanvas2DTestSuite(
  description: string,
  factory: (canvasOptions: CoreCanvasOptions, dimensions: FimDimensions) => CoreCanvas2D
): void {
  describe(description, () => {
    coreCanvas2DTestSuiteCreateDispose(description, factory);
    coreCanvas2DTestSuiteCanvas(description, factory);
    coreCanvas2DTestSuitePngJpeg(description, factory);
  });
}
