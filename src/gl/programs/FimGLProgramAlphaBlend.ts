// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimGLCanvas } from '../FimGLCanvas';
import { FimGLProgram } from '../FimGLProgram';
import { FimGLTexture } from '../FimGLTexture';
import { FimGLPreservedTexture } from '../processor/FimGLPreservedTexture';

/** GL program to copy from one texture to another */
export class FimGLProgramAlphaBlend extends FimGLProgram {
  constructor(canvas: FimGLCanvas) {
    let fragmentShader = require('./glsl/AlphaBlend.glsl');
    super(canvas, fragmentShader);
    this.compileProgram();
  }

  public setInputs(input1: FimGLTexture | FimGLPreservedTexture, input2: FimGLTexture | FimGLPreservedTexture,
      alpha: number): void {
    let uniforms = this.fragmentShader.uniforms;
    uniforms.u_input1.variableValue = input1;
    uniforms.u_input2.variableValue = input2;
    uniforms.u_input1Alpha.variableValue = alpha;
  }
}
