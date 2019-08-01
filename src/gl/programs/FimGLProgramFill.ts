// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimGLCanvas } from '../FimGLCanvas';
import { FimGLProgram } from '../FimGLProgram';
import { FimColor } from '../../primitives';

/** GL program to fill a texture or canvas with a solid color */
export class FimGLProgramFill extends FimGLProgram {
  constructor(canvas: FimGLCanvas) {
    let fragmentShader = require('./glsl/Fill.glsl');
    super(canvas, fragmentShader);
    this.compileProgram();
  }

  public setInputs(color: FimColor): void {
    this.fragmentShader.uniforms.u_color.variableValue = color.toVector();
  }
}
