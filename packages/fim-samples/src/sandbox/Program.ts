// WebGL Sandbox
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimGLCanvas, FimGLProgram, FimGLTexture } from '@leosingleton/fim';
import { GlslShader } from 'webpack-glsl-minify';

export class Program extends FimGLProgram {
  public constructor(canvas: FimGLCanvas, fragmentShader: GlslShader) {
    super(canvas, fragmentShader);
  }

  public compileProgram(): void {
    super.compileProgram();
  }

  public setConst(name: string, value: number | number[] | boolean): void {
    this.fragmentShader.consts[name].variableValue = value;
  }

  public setUniform(name: string, value: number | number[] | boolean | FimGLTexture): void {
    this.fragmentShader.uniforms[name].variableValue = value;
  }
}
