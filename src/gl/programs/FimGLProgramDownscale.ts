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
    let xPixels = this.calculateSamplePixelsOneAxis(xRatio); console.log(`${xRatio} -> ${xPixels}`);
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
    // Ratio is conveniently the number of pixels we need to sample, centered on zero...
    let halfRatio = ratio / 2;

    // First, calculate the number of samples we must take. With linear filtering, we can get the weighted average of 4
    // adjacent pixels with each texture2D call.
    let count = Math.ceil(halfRatio);

    // If there's only one pixel to sample, there's no offset or weight. This happens whenever ratio <= 2.
    if (count === 1) {
      return [[0, 1]];
    }

    // Cover as many pixels as possible by sampling the midpoint of 2 pixels. Note that the pixels[] array has not yet
    // calculated the proper weights yet--instead, we use the weight field to track the number of pixels counted.
    let pixels = [];
    let rightMost = 0;
    let weightSum = 0;
    if (count % 2 === 0) {
      // Even number of samples
      for (let n = 0; n < (count / 2) - 1; n++) {
        let offset = n * 2 + 1;
        pixels.push([offset, 2]);
        pixels.push([-offset, 2]);
        weightSum += 4;
        rightMost = offset + 1;
      }
    } else {
      // Odd number of samples
      pixels.push([0, 2]);
      weightSum += 2;
      for (let n = 0; n < Math.floor(count / 2) - 1; n++) {
        let offset = (n + 1) * 2;
        pixels.push([offset, 2]);
        pixels.push([-offset, 2]);
        weightSum += 4;
        rightMost = offset + 1;
      }
    }

    // At this point, there's between 1 and 2 pixels remaining on each side
    let pixelsRemaining = halfRatio - rightMost;

    // Calculate the two remaining samples
    let offset = rightMost + (pixelsRemaining / 2);
    pixels.push([offset, pixelsRemaining]);
    pixels.push([-offset, pixelsRemaining]);
    weightSum += pixelsRemaining * 2;

    // Finally, we have to normalize the weights so they add up to exactly 1
    pixels.forEach(pixel => pixel[1] /= weightSum);

    return pixels;
  }
}
