// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimGLCanvas } from '../FimGLCanvas';
import { FimGLProgram } from '../FimGLProgram';
import { FimGLShader } from '../FimGLShader';
import { FimGLTexture, FimGLTextureFlags } from '../FimGLTexture';
import { using } from '@leosingleton/commonlibs';
import { FimGLError, FimGLErrorCode } from '../FimGLError';

/** GL program which creates a Gaussian blur */
export class FimGLProgramMatrixOperation1D extends FimGLProgram {
  constructor(canvas: FimGLCanvas, kernelSize: number, fragmentShader?: FimGLShader) {
    fragmentShader = fragmentShader || require('./glsl/MatrixOperation1D.glsl');
    super(canvas, fragmentShader);

    this.kernelSize = kernelSize;
    this.fragmentShader.consts.KERNEL_SIZE.variableValue = [kernelSize];

    this.compileProgram();
  }

  /** Size of the kernel */
  public readonly kernelSize: number;

  public setInputs(inputTexture: FimGLTexture, kernel: number[], tempTexture?: FimGLTexture): void {
    this.inputTexture = inputTexture;
    this.tempTexture = tempTexture;

    if (kernel.length != this.kernelSize) {
      throw new FimGLError(FimGLErrorCode.AppError, `Expected kernel of size ${this.kernelSize}`);
    }

    this.fragmentShader.uniforms.u_kernel.variableValue = kernel;
  }

  public execute(outputTexture?: FimGLTexture): void {
    let gl = this.glCanvas;

    if (this.tempTexture) {
      this.executeInternal(this.tempTexture, outputTexture);
    } else {
      // If no temporary texture was specified, create one
      let inputTexture = this.inputTexture;
      let width = Math.min(outputTexture ? outputTexture.w : gl.w, inputTexture.w);
      let height = Math.min(outputTexture ? outputTexture.h : gl.h, inputTexture.h);
      let flags = inputTexture.flags & ~FimGLTextureFlags.InputOnly;

      using(new FimGLTexture(gl, width, height, flags), temp => {
        this.executeInternal(temp, outputTexture);
      });
    }
  }

  private executeInternal(tempTexture: FimGLTexture, outputTexture?: FimGLTexture): void {
    let uniforms = this.fragmentShader.uniforms;

    // Make the first pass in the X direction
    uniforms.u_input.variableValue = this.inputTexture;
    uniforms.u_inputSize.variableValue = [this.inputTexture.w, this.inputTexture.h];
    uniforms.u_isX.variableValue = 1;
    uniforms.u_isY.variableValue = 0;
    super.execute(tempTexture);

    // Make the second pass in the Y direction
    uniforms.u_input.variableValue = tempTexture;
    uniforms.u_isX.variableValue = 0;
    uniforms.u_isY.variableValue = 1;
    super.execute(outputTexture);
  }

  private inputTexture: FimGLTexture;
  private tempTexture?: FimGLTexture;
}
