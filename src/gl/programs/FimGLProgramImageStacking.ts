// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimGLCopy } from './Copy';
import { FimGLCanvas } from '../FimGLCanvas';
import { FimGLProgram } from '../FimGLProgram';
import { FimGLTexture } from '../FimGLTexture';

/** GL program which stacks images to reduce noise */
export class FimGLImageStacking extends FimGLProgram {
  /**
   * Constructor
   * @param canvas 
   */
  constructor(canvas: FimGLCanvas) {
    let fragmentShader = require('./glsl/ImageStacking.glsl');
    super(canvas, fragmentShader);

    // Image stacking requires the previous result, so create a canvas to store it
    this.oldCanvas = new FimGLTexture(canvas);
    this.fragmentShader.uniforms.u_old.variableValue = this.oldCanvas;

    // WebGL doesn't support using the same texture for both input and output, so create a temporary canvas
    this.tempCanvas = new FimGLTexture(canvas);

    this.copyProgram = new FimGLCopy(canvas);
    this.copyProgram.setInputs(this.tempCanvas);
  }

  /**
   * Sets the input values to the image stacking program
   * @param inputTexture Input texture
   * @param frames Approximate number of frames to average together
   */
  public setInputs(inputTexture: FimGLTexture, frames: number): void {
    let uniforms = this.fragmentShader.uniforms;
    uniforms.u_input.variableValue = inputTexture;
    uniforms.u_newAlpha.variableValue = 1 / frames;
  }

  public execute(outputTexture?: FimGLTexture): void {
    // Perform image stacking (temp = old + input)
    super.execute(this.tempCanvas);

    // Copy temp canvas to the old canvas
    this.copyProgram.execute(this.oldCanvas);

    // Copy temp canvas to the output
    this.copyProgram.execute(outputTexture);
  }

  private oldCanvas: FimGLTexture;
  private tempCanvas: FimGLTexture;
  private copyProgram: FimGLCopy;
}
