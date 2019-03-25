// src/fim/GLDarker.ts
// Fast Image Manipulation Library
// Copyright 2016-2018 Leo C. Singleton IV <leo@leosingleton.com>

import { FimGLCanvas } from './GLCanvas';
import { FimGLProgram } from './GLProgram';
import { FimGLTexture } from './GLTexture';

/** GL program to combine two textures and return the darker of the two */
export class FimGLDarker extends FimGLProgram {
  constructor(canvas: FimGLCanvas) {
    let fragmentShader = require('./glsl/Darker.glsl');
    super(canvas, fragmentShader);
  }

  public setInputs(input1: FimGLTexture, input2: FimGLTexture): void {
    let uniforms = this.fragmentShader.uniforms;
    uniforms.u_input1.variableValue = input1;
    uniforms.u_input2.variableValue = input2;
  }
}
