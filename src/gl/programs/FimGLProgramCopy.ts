// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { IFimGLCanvas } from '../FimGLCanvas';
import { FimGLProgram } from '../FimGLProgram';
import { IFimGLTexture } from '../FimGLTexture';

/** GL program to copy from one texture to another */
export class FimGLProgramCopy extends FimGLProgram {
  constructor(canvas: IFimGLCanvas) {
    let fragmentShader = require('./glsl/Copy.glsl');
    super(canvas, fragmentShader);
    this.compileProgram();
  }

  public setInputs(inputTexture: IFimGLTexture): void {
    this.fragmentShader.uniforms.u_input.variableValue = inputTexture;
  }
}
