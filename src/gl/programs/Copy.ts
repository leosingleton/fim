// src/fim/GLCopy.ts
// Fast Image Manipulation Library
// Copyright 2016-2018 Leo C. Singleton IV <leo@leosingleton.com>

import { FimGLCanvas } from './GLCanvas';
import { FimGLProgram } from './GLProgram';
import { FimGLTexture } from './GLTexture';

/** GL program to copy from one texture to another */
export class FimGLCopy extends FimGLProgram {
  constructor(canvas: FimGLCanvas) {
    let fragmentShader = require('./glsl/Copy.glsl');
    super(canvas, fragmentShader);
  }

  public setInputs(inputTexture: FimGLTexture): void {
    this.fragmentShader.uniforms.u_input.variableValue = inputTexture;
  }
}
