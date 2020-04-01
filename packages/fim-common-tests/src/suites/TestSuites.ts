// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { fimTestSuiteBackup } from '../api/Backup';
import { fimTestSuiteCanvas } from '../api/Canvas';
import { fimTestSuiteCreateDispose } from '../api/CreateDispose';
import { fimTestSuiteDownscaled } from '../api/Downscaled';
import { fimTestSuiteImage } from '../api/Image';
import { fimTestSuiteOversized } from '../api/Oversized';
import { fimTestSuitePngJpeg } from '../api/PngJpeg';
import { fimTestSuiteResourceTracker } from '../api/ResourceTracker';
import { fimTestSuiteWebGL } from '../api/WebGL';
import { fimTestSuiteWebGLContextLost } from '../api/WebGLContextLost';
import { coreCanvas2DTestSuiteCanvas } from '../core/CoreCanvas2D/Canvas';
import { coreCanvas2DTestSuiteCreateDispose } from '../core/CoreCanvas2D/CreateDispose';
import { coreCanvas2DTestSuitePngJpeg } from '../core/CoreCanvas2D/PngJpeg';
import { coreCanvasWebGLTestSuiteCanvas } from '../core/CoreCanvasWebGL/Canvas';
import { coreCanvasWebGLTestSuiteCapabilities } from '../core/CoreCanvasWebGL/Capabilities';
import { coreCanvasWebGLTestSuiteContextLost } from '../core/CoreCanvasWebGL/ContextLost';
import { coreCanvasWebGLTestSuiteCreateDispose } from '../core/CoreCanvasWebGL/CreateDispose';
import { coreCanvasWebGLTestSuiteExportCopyTo } from '../core/CoreCanvasWebGL/ExportCopyTo';
import { coreCanvasWebGLTestSuiteShader } from '../core/CoreCanvasWebGL/Shader';
import { coreCanvasWebGLTestSuiteTexture } from '../core/CoreCanvasWebGL/Texture';
import { fimTestSuiteOpBrightnessContrast } from '../ops/OpBrightnessContrast';
import { fimTestSuiteOpBuiltin } from '../ops/OpBuiltin';
import { fimTestSuiteOpDownscale } from '../ops/OpDownscale';
import { fimTestSuiteOpGaussianBlur } from '../ops/OpGaussianBlur';
import { fimTestSuiteOpMisc } from '../ops/OpMisc';
import { Fim, FimDimensions } from '@leosingleton/fim';
import { CoreCanvas2D, CoreCanvasOptions, CoreCanvasWebGL } from '@leosingleton/fim/internals';

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
    // api/ tests
    fimTestSuiteCreateDispose(description, factory);
    fimTestSuiteImage(description, factory);
    fimTestSuiteCanvas(description, factory);
    fimTestSuitePngJpeg(description, factory);
    fimTestSuiteWebGL(description, factory);
    fimTestSuiteWebGLContextLost(description, factory);
    fimTestSuiteOversized(description, factory);
    fimTestSuiteDownscaled(description, factory);
    fimTestSuiteBackup(description, factory);
    fimTestSuiteResourceTracker(description, factory);

    // ops/ tests
    fimTestSuiteOpMisc(description, factory);
    fimTestSuiteOpBuiltin(description, factory);
    fimTestSuiteOpBrightnessContrast(description, factory);
    fimTestSuiteOpDownscale(description, factory);
    fimTestSuiteOpGaussianBlur(description, factory);
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
    coreCanvas2DTestSuiteCreateDispose(description, factory);
    coreCanvas2DTestSuiteCanvas(description, factory);
    coreCanvas2DTestSuitePngJpeg(description, factory);
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
    coreCanvasWebGLTestSuiteCreateDispose(description, factory);
    coreCanvasWebGLTestSuiteCapabilities(description, factory);
    coreCanvasWebGLTestSuiteCanvas(description, factory);
    coreCanvasWebGLTestSuiteExportCopyTo(description, factory);
    coreCanvasWebGLTestSuiteShader(description, factory);
    coreCanvasWebGLTestSuiteTexture(description, factory);
    coreCanvasWebGLTestSuiteContextLost(description, factory);
  }
}
