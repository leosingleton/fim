/*!
 * fim-common-tests - Fast Image Manipulation Library for JavaScript
 * Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
 * Released under the MIT license
 */

import { fimTestSuite } from './api';
import { coreCanvas2DTestSuite } from './core/CoreCanvas2D';
import { coreCanvasWebGLTestSuite } from './core/CoreCanvasWebGL';
import { Fim, FimDimensions } from '@leosingleton/fim';
import { CoreCanvas2D, CoreCanvasOptions, CoreCanvasWebGL } from '@leosingleton/fim/internals';

export * from './common/Async';
export * from './common/ContextLost';
export * from './common/CoreOptions';
export * from './common/Globals';
export * from './common/PixelData';
export * from './common/Shaders';
export * from './common/TestImages';
export * from './common/TestPatterns';

/** Reusable test suites */
export namespace TestSuites {
  /**
   * Executes a suite of common tests using the FIM client created via factory methods
   * @param description Description to show in the test framework
   * @param factory Lambda to call FimXYZFactory.create()
   */
  export function fim(
    description: string,
    factory: (maxImageDimensions: FimDimensions) => Fim
  ): void {
    fimTestSuite(description, factory);
  }

  /**
   * Executes a suite of common tests using the CoreCanvas2D objects created via factory methods
   * @param description Description to show in the test framework
   * @param factory Lambda to create the CoreCanvas2D instance
   */
  export function coreCanvas2D(
    description: string,
    factory: (canvasOptions: CoreCanvasOptions, dimensions: FimDimensions) => CoreCanvas2D
  ): void {
    coreCanvas2DTestSuite(description, factory);
  }

  /**
   * Executes a suite of common tests using the CoreCanvasWebGL objects created via factory methods
   * @param description Description to show in the test framework
   * @param factory Lambda to create the CoreCanvasWebGL instance
   */
  export function coreCanvasWebGL(
    description: string,
    factory: (canvasOptions: CoreCanvasOptions, dimensions: FimDimensions) => CoreCanvasWebGL
  ): void {
    coreCanvasWebGLTestSuite(description, factory);
  }
}
