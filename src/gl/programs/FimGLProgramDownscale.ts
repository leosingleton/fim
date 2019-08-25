// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimGLCanvas } from '../FimGLCanvas';
import { FimGLProgram } from '../FimGLProgram';
import { FimGLTexture } from '../FimGLTexture';
import { FimGLPreservedTexture } from '../processor/FimGLPreservedTexture';

/** GL program to downscale a texture to a lower resolution */
export class FimGLProgramDownscale extends FimGLProgram {
  /**
   * Constructor
   * @param canvas FimGLCanvas
   * @param xRatio Downscale ratio of the x-axis, where 1 is unchanged, 2 is halved, 4 is quartered...
   * @param yRatio Downscale ratio of the y-axis, where 1 is unchanged, 2 is halved, 4 is quartered...
   */
  constructor(canvas: FimGLCanvas, xRatio: number, yRatio: number) {
    let fragmentShader = require('./glsl/Downscale.glsl');
    super(canvas, fragmentShader);

    this.calculateSamplePixels(xRatio, yRatio);

    this.fragmentShader.consts.PIXELS.variableValue = [this.pixelCount];
    this.compileProgram();
  }

  public setInputs(inputTexture: FimGLTexture | FimGLPreservedTexture): void {
    this.fragmentShader.uniforms.uInput.variableValue = inputTexture;

    // The X and Y of the sample pixels must be scaled based on the actual input resolution
    let scaledPixels: number[] = [];
    for (let n = 0; n < this.pixelCount; n++) {
      let x = this.pixels[n * 3];
      let y = this.pixels[n * 3 + 1];
      let z = this.pixels[n * 3 + 2];
      scaledPixels.push(x / inputTexture.w);
      scaledPixels.push(y / inputTexture.h);
      scaledPixels.push(z);
    }
    this.fragmentShader.uniforms.uPixels.variableValue = scaledPixels;
  }

  private pixels: number[];
  private pixelCount: number;

  private calculateSamplePixels(xRatio: number, yRatio: number): void {
    this.pixelCount = 4;
    this.pixels = [-1, -1, 0.25, -1, 1, 0.25, 1, -1, 0.25, 1, 1, 0.25];
  }
}
