// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { coreCanvasWebGLTestSuiteCanvas } from './Canvas';
import { coreCanvasWebGLTestSuiteCapabilities } from './Capabilities';
import { coreCanvasWebGLTestSuiteCreateDispose } from './CreateDispose';
import { coreCanvasWebGLTestSuiteShader } from './Shader';
import { coreCanvasWebGLTestSuiteTexture } from './Texture';
import { FimDimensions } from '@leosingleton/fim';
import { CoreCanvasWebGL } from '@leosingleton/fim/build/internal';

/**
 * Executes a suite of common tests using the CoreCanvasWebGL objects created via factory methods
 * @param description Description to show in the test framework
 * @param factory Lambda to create the CoreCanvasWebGL instance
 */
export function coreCanvasWebGLTestSuite(
  description: string,
  factory: (dimensions: FimDimensions) => CoreCanvasWebGL
): void {
  describe(description, () => {
    coreCanvasWebGLTestSuiteCreateDispose(description, factory);
    coreCanvasWebGLTestSuiteCapabilities(description, factory);
    coreCanvasWebGLTestSuiteCanvas(description, factory);
    coreCanvasWebGLTestSuiteShader(description, factory);
    coreCanvasWebGLTestSuiteTexture(description, factory);
  });
}
