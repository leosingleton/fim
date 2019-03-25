// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimGLCanvas } from '../FimGLCanvas';
import { FimGLProgram } from '../FimGLProgram';
import { FimGLTexture } from '../FimGLTexture';

/** GL program to combine two textures and return the darker of the two */
export class FimGLProgramDarker extends FimGLProgram {
  constructor(canvas: FimGLCanvas) {
    let fragmentShader = require('./glsl/Darker.glsl');
    super(canvas, fragmentShader);
    this.compileProgram();
  }

  public setInputs(input1: FimGLTexture, input2: FimGLTexture): void {
    let uniforms = this.fragmentShader.uniforms;
    uniforms.u_input1.variableValue = input1;
    uniforms.u_input2.variableValue = input2;
  }
}
