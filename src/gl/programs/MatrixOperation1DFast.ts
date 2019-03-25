// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimGLCanvas } from '../FimGLCanvas';
import { FimGLProgram } from '../FimGLProgram';
import { FimGLTexture } from '../FimGLTexture';
import { FimGLShader } from '../FimGLShader';

/** GL program which creates a Gaussian blur (new, faster, implementation created in the whiteboard-webgl branch) */
export class FimGLMatrixOperation1DFast extends FimGLProgram {
  constructor(canvas: FimGLCanvas, kernel: number[], skipPixels = false) {
    let fragmentShaderSkip = require('./glsl/MatrixOperation1DFast.glsl') as FimGLShader;
    let fragmentShaderNoSkip = require('./glsl/MatrixOperation1D.glsl') as FimGLShader;
    let fragmentShader = skipPixels ? fragmentShaderSkip : fragmentShaderNoSkip;
    super(canvas, fragmentShader);
    this.glCanvas = canvas;

    this.fragmentShader.uniforms.u_kernel.variableValue = kernel;
    this.fragmentShader.consts.KERNEL_SIZE.variableValue = [kernel.length];
  }

  public setInput(inputTexture: FimGLTexture): void {
    this.inputTexture = inputTexture;
  }

  public execute(outputTexture?: FimGLTexture): void {
    let uniforms = this.fragmentShader.uniforms;
    let tempCanvas = new FimGLTexture(this.glCanvas);

    // Make the first pass in the X direction
    uniforms.u_input.variableValue = this.inputTexture;
    uniforms.u_inputSize.variableValue = [this.inputTexture.w, this.inputTexture.h];
    uniforms.u_isX.variableValue = 1;
    uniforms.u_isY.variableValue = 0;
    super.execute(tempCanvas);

    // Make the second pass in the Y direction
    uniforms.u_input.variableValue = tempCanvas;
    uniforms.u_isX.variableValue = 0;
    uniforms.u_isY.variableValue = 1;
    super.execute(outputTexture);

    tempCanvas.dispose();
  }

  private glCanvas: FimGLCanvas;
  private inputTexture: FimGLTexture;
}
