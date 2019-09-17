// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimGLCanvas } from '../FimGLCanvas';
import { FimGLProgram } from '../FimGLProgram';
import { IFimGLTexture } from '../FimGLTexture';
import { FimGLPreservedTexture } from '../processor/FimGLPreservedTexture';

/** GL program to apply a y = mx + b transformation */
export class FimGLProgramLinearTransform extends FimGLProgram {
  constructor(canvas: FimGLCanvas) {
    let fragmentShader = require('./glsl/LinearTransform.glsl');
    super(canvas, fragmentShader);
    this.compileProgram();
  }

  public setInputs(inputTexture: IFimGLTexture | FimGLPreservedTexture, m: number, b: number) {
    let uniforms = this.fragmentShader.uniforms;
    uniforms.u_input.variableValue = inputTexture;
    uniforms.u_m.variableValue = m;
    uniforms.u_b.variableValue = b;
  }

  /** Adjusts brightness and contrast.  (Range of input values is -1 to 1, where 0 is no change) */
  public setBrightnessContrast(inputTexture: IFimGLTexture, brightness: number, contrast: number): void {
    // To adjust contrast (c), we multiply to increase the slope, however we want to keep the midpoint at 0.5.
    //   Solving y = mx + b, we get: y = cx + (0.5 - 0.5c)
    // The contrast parameter is -1 to 1 and needs to be scaled to 0 to Infinity
    //   -1 to 0 ==> (c + 1)
    //    0 to 1 ==>  1 / (1 - c)
    // Thus m and b in y = mx + b are below:
    var m = (contrast < 0.0) ? (contrast + 1.0) : (1.0 / (1.0 - contrast));
    var b = 0.5 - (0.5 * m) + brightness;
    this.setInputs(inputTexture, m, b);
  }
}
