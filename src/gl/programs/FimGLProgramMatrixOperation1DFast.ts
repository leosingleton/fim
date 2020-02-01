// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimGLProgramMatrixOperation1D } from './FimGLProgramMatrixOperation1D';
import { FimGLCanvas } from '../FimGLCanvas';
import { FimGLShader } from '../FimGLShader';

/** GL program which creates a Gaussian blur (faster implementation based on using every other pixel) */
export class FimGLProgramMatrixOperation1DFast extends FimGLProgramMatrixOperation1D {
  constructor(canvas: FimGLCanvas, kernelSize: number) {
    const fragmentShader = require('./glsl/MatrixOperation1DFast.glsl') as FimGLShader;
    super(canvas, kernelSize, fragmentShader);
  }
}
