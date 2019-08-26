// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimGLCanvas } from '../FimGLCanvas';
import { FimGLError, FimGLErrorCode } from '../FimGLError';
import { FimGLProgram } from '../FimGLProgram';
import { FimGLTexture, FimGLTextureFlags } from '../FimGLTexture';
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
    // Ensure the input texture has linear filtering enabled
    if ((inputTexture.textureOptions.textureFlags & FimGLTextureFlags.LinearSampling) === 0) {
      throw new FimGLError(FimGLErrorCode.AppError, 'NotLinear');
    }
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
    let xPixels = this.calculateSamplePixelsOneAxis(xRatio);
    let yPixels = this.calculateSamplePixelsOneAxis(yRatio);

    let xCount = xPixels.length;
    let yCount = yPixels.length;
    this.pixelCount = xCount * yCount;
    
    let pixels: number[] = [];
    for (let x = 0; x < xCount; x++) {
      let xPixel = xPixels[x];
      for (let y = 0; y < yCount; y++) {
        let yPixel = yPixels[y];
        pixels.push(xPixel[0]);             // X offset
        pixels.push(yPixel[0]);             // Y offset
        pixels.push(xPixel[1] * yPixel[1]); // Weight
      }
    }
    this.pixels = pixels;
  }

  /**
   * Calculates the pixels to sample in one direction
   * @param ratio Downscale ratio of the axis, where 1 is unchanged, 2 is halved, 4 is quartered...
   * @returns Array of [offset, weight] tuples for the pixels we should sample
   */
  private calculateSamplePixelsOneAxis(ratio: number): number[][] {
    return [[-1, 0.5], [1, 0.5]];
  }
}
