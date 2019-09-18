// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimGLCanvas } from '../FimGLCanvas';
import { FimGLError, FimGLErrorCode } from '../FimGLError';
import { FimGLProgram } from '../FimGLProgram';
import { FimGLTextureFlags, IFimGLTextureLike } from '../FimGLTexture';

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

    let c = FimGLProgramDownscale.calculateSamplePixels(xRatio, yRatio);
    this.pixelCount = c.pixelCount;
    this.pixels = c.pixels;

    this.fragmentShader.consts.PIXELS.variableValue = [this.pixelCount];
    this.compileProgram();
  }

  public setInputs(inputTexture: IFimGLTextureLike): void {
    let texture = inputTexture.getTexture();
  
    // Ensure the input texture has linear filtering enabled
    if ((texture.textureOptions.textureFlags & FimGLTextureFlags.LinearSampling) === 0) {
      throw new FimGLError(FimGLErrorCode.AppError, 'NotLinear');
    }
    this.fragmentShader.uniforms.uInput.variableValue = inputTexture;

    // The X and Y of the sample pixels must be scaled based on the actual input resolution
    this.fragmentShader.uniforms.uPixels.variableValue = FimGLProgramDownscale.scaleSamplePixels(this.pixelCount,
      this.pixels, texture.w, texture.h);
  }

  private pixels: number[];
  private pixelCount: number;

  /**
   * Calculates the location and weight of the pixels that should be sampled to create an accurate image downscale
   * @param xRatio Downscale ratio of the X-axis, where 1 is unchanged, 2 is halved, 4 is quartered...
   * @param yRatio Downscale ratio of the Y-axis, where 1 is unchanged, 2 is halved, 4 is quartered...
   * @returns An object with two properties:
   * - pixelCount The number of pixels to samples
   * - pixels An array with 3 elements per pixel: X-offset, Y-offset, and weight. The X-offset and Y-offset are in
   *    pixels, and still need to be scale to 0 to 1 values before being used as uniforms. Use the scaleSamplePixels()
   *    function to do so.
   */
  public static calculateSamplePixels(xRatio: number, yRatio: number): { pixelCount: number, pixels: number[] } {
    let xPixels = this.calculateSamplePixelsOneAxis(xRatio);
    let yPixels = this.calculateSamplePixelsOneAxis(yRatio);

    let xCount = xPixels.length;
    let yCount = yPixels.length;
    
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

    return {
      pixelCount: xCount * yCount,
      pixels: pixels
    };
  }

  /**
   * Calculates the pixels to sample in one direction
   * @param ratio Downscale ratio of the axis, where 1 is unchanged, 2 is halved, 4 is quartered...
   * @returns Array of [offset, weight] tuples for the pixels we should sample
   */
  private static calculateSamplePixelsOneAxis(ratio: number): number[][] {
    // Ratio is conveniently the number of pixels we need to sample, centered on zero...
    let halfRatio = ratio / 2;

    // First, calculate the number of samples we must take. With linear filtering, we can get the weighted average of 4
    // adjacent pixels with each texture2D call.
    let count = Math.ceil(halfRatio);

    // If there's only one pixel to sample, there's no offset or weight. This happens whenever ratio <= 2.
    if (count === 1) {
      return [[0, 1]];
    }

    // Calculate the offset of the rightmost point
    let rightMost = halfRatio - 1;

    // Space the sample points equally
    let spacing = (rightMost * 2) / (count - 1);

    // Create the points
    let pixels = [];
    let weight = 1 / count;
    for (let n = 0; n < count; n++) {
      let offset = -rightMost + spacing * n;
      pixels.push([offset, weight]);
    }

    return pixels;
  }

  /**
   * Scales the X- and Y-offsets in the sample pixels array to 0 to 1 values to be used as uniforms.
   * @param pixelCount Numnber of pixels in the pixels array (pixels.length / 3)
   * @param pixels An array of 3 elements per pixel: X-offset, Y-offst, and weight. The offsets are in pixels.
   * @param width Width of the input image, in pixels
   * @param height Height of the input image, in pixels
   * @returns New pixels array where the X- and Y-offsets have been scale to 0 to 1 values based on the input image
   *    dimensions
   */
  public static scaleSamplePixels(pixelCount: number, pixels: number[], width: number, height: number): number[] {
    let scaledPixels: number[] = [];
    for (let n = 0; n < pixelCount; n++) {
      let x = pixels[n * 3];
      let y = pixels[n * 3 + 1];
      let z = pixels[n * 3 + 2];
      scaledPixels.push(x / width);
      scaledPixels.push(y / height);
      scaledPixels.push(z);
    }
    return scaledPixels;
  }
}
