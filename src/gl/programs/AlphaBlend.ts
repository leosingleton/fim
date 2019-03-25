// src/fim/GLAlphaBlend.ts
// Fast Image Manipulation Library
// Copyright 2016-2018 Leo C. Singleton IV <leo@leosingleton.com>

import { FimGLCanvas } from './GLCanvas';
import { FimGLProgram } from './GLProgram';
import { FimGLTexture } from './GLTexture';

/** GL program to copy from one texture to another */
export class FimGLAlphaBlend extends FimGLProgram {
  constructor(canvas: FimGLCanvas) {
    let fragmentShader = require('./glsl/AlphaBlend.glsl');
    super(canvas, fragmentShader);
  }

  public setInputs(input1: FimGLTexture, input2: FimGLTexture, alpha: number): void {
    let uniforms = this.fragmentShader.uniforms;
    uniforms.u_input1.variableValue = input1;
    uniforms.u_input2.variableValue = input2;
    uniforms.u_input1Alpha.variableValue = alpha;
  }
}
