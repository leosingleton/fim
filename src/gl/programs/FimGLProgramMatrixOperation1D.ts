// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimGLCanvas } from '../FimGLCanvas';
import { FimGLProgram } from '../FimGLProgram';
import { FimGLShader } from '../FimGLShader';
import { FimGLTextureFlags, IFimGLTextureLike } from '../FimGLTexture';
import { FimGLError, FimGLErrorCode } from '../FimGLError';
import { using } from '@leosingleton/commonlibs';

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

  public setInputs(inputTexture: IFimGLTextureLike, kernel: number[], tempTexture?: IFimGLTextureLike): void {
    this.inputTexture = inputTexture;
    this.tempTexture = tempTexture;

    if (kernel.length !== this.kernelSize) {
      throw new FimGLError(FimGLErrorCode.AppError, `Expected kernel of size ${this.kernelSize}`);
    }

    this.fragmentShader.uniforms.u_kernel.variableValue = kernel;
  }

  public execute(outputTexture?: IFimGLTextureLike): void {
    const gl = this.glCanvas;

    if (this.tempTexture) {
      this.executeInternal(this.tempTexture, outputTexture);
    } else {
      // If no temporary texture was specified, create one
      const inputTexture = this.inputTexture.getTexture();
      const width = Math.min(outputTexture ? outputTexture.getTexture().w : gl.w, inputTexture.w);
      const height = Math.min(outputTexture ? outputTexture.getTexture().h : gl.h, inputTexture.h);
      const flags = inputTexture.textureOptions.textureFlags & ~FimGLTextureFlags.InputOnly;

      const outTexture = outputTexture;
      using(gl.createTexture(width, height, { textureFlags: flags }), temp => {
        this.executeInternal(temp, outTexture);
      });
    }
  }

  private executeInternal(tempTexture: IFimGLTextureLike, outputTexture?: IFimGLTextureLike): void {
    const uniforms = this.fragmentShader.uniforms;
    const inputTexture = this.inputTexture.getTexture();

    // Make the first pass in the X direction
    uniforms.u_input.variableValue = this.inputTexture;
    uniforms.u_inputSize.variableValue = [inputTexture.w, inputTexture.h];
    uniforms.u_isX.variableValue = 1;
    uniforms.u_isY.variableValue = 0;
    super.execute(tempTexture);

    // Make the second pass in the Y direction
    uniforms.u_input.variableValue = tempTexture;
    uniforms.u_isX.variableValue = 0;
    uniforms.u_isY.variableValue = 1;
    super.execute(outputTexture);
  }

  private inputTexture: IFimGLTextureLike;
  private tempTexture?: IFimGLTextureLike;
}
