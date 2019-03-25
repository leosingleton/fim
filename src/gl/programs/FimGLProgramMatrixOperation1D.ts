// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimGLCanvas } from '../FimGLCanvas';
import { FimGLProgram } from '../FimGLProgram';
import { FimGLTexture } from '../FimGLTexture';

/** GL program which creates a Gaussian blur */
export class FimGLProgramMatrixOperation1D extends FimGLProgram {
  constructor(canvas: FimGLCanvas, kernelSize: number) {
    let fragmentShader = require('./glsl/MatrixOperation1D.glsl');
    super(canvas, fragmentShader);

    this.kernelSize = kernelSize;
    this.fragmentShader.consts.KERNEL_SIZE.variableValue = [kernelSize];
    
    // Execution requires two passes, so create an intermediate canvas
    this.intermediateCanvas = new FimGLTexture(canvas);
  }

  /** Size of the kernel */
  public readonly kernelSize: number;

  public setKernel(kernel: number[]) {
    if (kernel.length != this.kernelSize) {
      throw new Error('Expected kernel of size ' + this.kernelSize);
    }

    this.fragmentShader.uniforms.u_kernel.variableValue = kernel;
  }

  public setInput(inputTexture: FimGLTexture): void {
    this.inputTexture = inputTexture;
  }

  public execute(outputTexture?: FimGLTexture): void {
    let uniforms = this.fragmentShader.uniforms;

    // Make the first pass in the X direction
    uniforms.u_input.variableValue = this.inputTexture;
    uniforms.u_inputSize.variableValue = [this.inputTexture.w, this.inputTexture.h];
    uniforms.u_isX.variableValue = 1;
    uniforms.u_isY.variableValue = 0;
    super.execute(this.intermediateCanvas);

    // Make the second pass in the Y direction
    uniforms.u_input.variableValue = this.intermediateCanvas;
    uniforms.u_isX.variableValue = 0;
    uniforms.u_isY.variableValue = 1;
    super.execute(outputTexture);
  }

  private intermediateCanvas: FimGLTexture;
  private inputTexture: FimGLTexture;
}
