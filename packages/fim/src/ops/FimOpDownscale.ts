// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { Fim } from '../api/Fim';
import { FimImage } from '../api/FimImage';
import { FimOperationShader } from '../api/FimOperationShader';
import { FimError, FimErrorCode } from '../primitives/FimError';
import { FimRect } from '../primitives/FimRect';

/** Built-in operation to downscale a texture to a lower resolution */
export class FimOpDownscale extends FimOperationShader {
  /**
   * Constructor
   * @param fim FIM instance
   */
  public constructor(fim: Fim) {
    const source = require('../../build/ops/glsl/Downscale.glsl.js');
    const shader = fim.createGLShader(source, undefined, 'Downscale');
    super(fim, shader);
  }

  public setInput(input: FimImage): void {
    // TODO: Ensure the input image has linear filtering enabled
    /*if ((texture.textureOptions.textureFlags & FimGLTextureFlags.LinearSampling) === 0) {
      throw new FimGLError(FimGLErrorCode.AppError, 'NotLinear');
    }*/

    this.inputImage = input;
  }

  /** Input image */
  private inputImage: FimImage;

  public executeAsync(outputImage: FimImage, destCoords?: FimRect): Promise<void> {
    const me = this;

    // Ensure input image has been set
    if (!me.inputImage) {
      FimError.throwOnInvalidParameter('inputImage');
    }

    // Calculate the input and output dimensions and downscale ratios
    const inputDimensions = me.inputImage.imageDimensions;
    const outputDimensions = destCoords ? destCoords.dim : outputImage.imageDimensions;
    const xRatio = inputDimensions.w / outputDimensions.w;
    const yRatio = inputDimensions.h / outputDimensions.h;

    if (Math.ceil(xRatio) * Math.ceil(yRatio) < 64) {
      // Fast path: Run the downscale shader in a single pass
      return me.executeInternalAsync(me.inputImage, xRatio, yRatio, outputImage, destCoords);
    } else {
      // Slow path: Run the downscale shader is separate passes for the X-axis versus Y-axis. Although this is much
      // faster computationally, as it is not O(n^2),
      throw new FimError(FimErrorCode.NotImplemented);
    }
  }

  private executeInternalAsync(inputImage: FimImage, xRatio: number, yRatio: number, outputImage: FimImage,
      destCoords?: FimRect): Promise<void> {
    // Calculate the pixels to sample
    const c = FimOpDownscale.calculateSamplePixels(xRatio, yRatio);
    const pixelArray = FimOpDownscale.scaleSamplePixels(c.pixelCount, c.pixels, inputImage.imageDimensions.w,
      inputImage.imageDimensions.h);

    // Set the constants and uniforms for the shader
    this.shader.setConstants({
      PIXELS: c.pixelCount
    });
    this.shader.setUniforms({
      uInput: inputImage,
      uPixels: pixelArray
    });

    // Execute the shader
    return super.executeAsync(outputImage, destCoords);
  }

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
    const xPixels = this.calculateSamplePixelsOneAxis(xRatio);
    const yPixels = this.calculateSamplePixelsOneAxis(yRatio);

    const xCount = xPixels.length;
    const yCount = yPixels.length;

    const pixels: number[] = [];
    for (let x = 0; x < xCount; x++) {
      const xPixel = xPixels[x];
      for (let y = 0; y < yCount; y++) {
        const yPixel = yPixels[y];
        pixels.push(xPixel[0]);             // X offset
        pixels.push(yPixel[0]);             // Y offset
        pixels.push(xPixel[1] * yPixel[1]); // Weight
      }
    }

    return {
      pixelCount: xCount * yCount,
      pixels
    };
  }

  /**
   * Calculates the pixels to sample in one direction
   * @param ratio Downscale ratio of the axis, where 1 is unchanged, 2 is halved, 4 is quartered...
   * @returns Array of [offset, weight] tuples for the pixels we should sample
   */
  private static calculateSamplePixelsOneAxis(ratio: number): number[][] {
    // Ratio is conveniently the number of pixels we need to sample, centered on zero...
    const halfRatio = ratio / 2;

    // First, calculate the number of samples we must take. With linear filtering, we can get the weighted average of 4
    // adjacent pixels with each texture2D call.
    const count = Math.ceil(halfRatio);

    // If there's only one pixel to sample, there's no offset or weight. This happens whenever ratio <= 2.
    if (count === 1) {
      return [[0, 1]];
    }

    // Calculate the offset of the rightmost point
    const rightMost = halfRatio - 1;

    // Space the sample points equally
    const spacing = (rightMost * 2) / (count - 1);

    // Create the points
    const pixels = [];
    const weight = 1 / count;
    for (let n = 0; n < count; n++) {
      const offset = -rightMost + spacing * n;
      pixels.push([offset, weight]);
    }

    return pixels;
  }

  /**
   * Scales the X- and Y-offsets in the sample pixels array to 0 to 1 values to be used as uniforms.
   * @param pixelCount Number of pixels in the pixels array (pixels.length / 3)
   * @param pixels An array of 3 elements per pixel: X-offset, Y-offst, and weight. The offsets are in pixels.
   * @param width Width of the input image, in pixels
   * @param height Height of the input image, in pixels
   * @returns New pixels array where the X- and Y-offsets have been scale to 0 to 1 values based on the input image
   *    dimensions
   */
  public static scaleSamplePixels(pixelCount: number, pixels: number[], width: number, height: number): number[] {
    const scaledPixels: number[] = [];
    for (let n = 0; n < pixelCount; n++) {
      const x = pixels[n * 3];
      const y = pixels[n * 3 + 1];
      const z = pixels[n * 3 + 2];
      scaledPixels.push(x / width);
      scaledPixels.push(y / height);
      scaledPixels.push(z);
    }
    return scaledPixels;
  }
}
