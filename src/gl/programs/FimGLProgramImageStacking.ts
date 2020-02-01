// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimGLProgramCopy } from './FimGLProgramCopy';
import { FimGLCanvas } from '../FimGLCanvas';
import { FimGLProgram } from '../FimGLProgram';
import { IFimGLTextureLike } from '../FimGLTexture';
import { using } from '@leosingleton/commonlibs';

/** GL program which stacks images to reduce noise */
export class FimGLProgramImageStacking extends FimGLProgram {
  /**
   * Constructor
   * @param canvas
   */
  constructor(canvas: FimGLCanvas) {
    const fragmentShader = require('./glsl/ImageStacking.glsl');
    super(canvas, fragmentShader);
    this.compileProgram();

    // Image stacking requires the previous result, so create a canvas to store it
    this.oldCanvas = this.disposable.addDisposable(canvas.createTexture());
    this.fragmentShader.uniforms.u_old.variableValue = this.oldCanvas;

    this.copyProgram = this.disposable.addDisposable(new FimGLProgramCopy(canvas));
  }

  /**
   * Sets the input values to the image stacking program
   * @param inputTexture Input texture
   * @param frames Approximate number of frames to average together
   */
  public setInputs(inputTexture: IFimGLTextureLike, frames: number): void {
    const uniforms = this.fragmentShader.uniforms;
    uniforms.u_input.variableValue = inputTexture;
    uniforms.u_newAlpha.variableValue = 1 / frames;
  }

  public execute(outputTexture?: IFimGLTextureLike): void {
    using(this.glCanvas.createTexture(), temp => {
      // Perform image stacking (temp = old + input)
      super.execute(temp);

      // Copy temp canvas to the old canvas
      this.copyProgram.setInputs(temp);
      this.copyProgram.execute(this.oldCanvas);

      // Copy temp canvas to the output
      this.copyProgram.execute(outputTexture);
    });
  }

  private oldCanvas: IFimGLTextureLike;
  private copyProgram: FimGLProgramCopy;
}
