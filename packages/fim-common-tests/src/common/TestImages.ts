// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { bottomLeft, bottomRight, topLeft, topRight } from './Globals';
import { expectedPixelDataLength, getPixelFromPixelData } from './PixelData';
import { TestColors } from './TestColors';
import { FimColor, FimDimensions, FimImage } from '@leosingleton/fim';
import { CoreCanvas } from '@leosingleton/fim/internals';

/** Portable implementation of atob(). Works on both browser and Node.js. */
function atobPortable(str: string): string {
  if (typeof atob === 'function') {
    // Browsers natively have atob(). Just use that.
    return atob(str);
  } else {
    // On Node.js, use the Buffer class
    return Buffer.from(str, 'base64').toString('binary');
  }
}

export namespace TestImages {
  /**
   * A Base64-encoded string containing a 128x128 pixel JPEG. The image consists of four solid-colored squares:
   * - Top-Left = Red
   * - Top-Right = Green
   * - Bottom-Left = Blue
   * - Bottom-Right = Black
   */
  export const fourSquaresJpegBase64 =
    '/9j/4AAQSkZJRgABAQEAYABgAAD/4QBmRXhpZgAATU0AKgAAAAgABgESAAMAAAABAAEAAAMBAAUA' +
    'AAABAAAAVgMDAAEAAAABAAAAAFEQAAEAAAABAQAAAFERAAQAAAABAAAOw1ESAAQAAAABAAAOwwAA' +
    'AAAAAYagAACxj//bAEMAAgEBAgEBAgICAgICAgIDBQMDAwMDBgQEAwUHBgcHBwYHBwgJCwkICAoI' +
    'BwcKDQoKCwwMDAwHCQ4PDQwOCwwMDP/bAEMBAgICAwMDBgMDBgwIBwgMDAwMDAwMDAwMDAwMDAwM' +
    'DAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDP/AABEIAIAAgAMBIgACEQEDEQH/xAAf' +
    'AAABBQEBAQEBAQAAAAAAAAAAAQIDBAUGBwgJCgv/xAC1EAACAQMDAgQDBQUEBAAAAX0BAgMABBEF' +
    'EiExQQYTUWEHInEUMoGRoQgjQrHBFVLR8CQzYnKCCQoWFxgZGiUmJygpKjQ1Njc4OTpDREVGR0hJ' +
    'SlNUVVZXWFlaY2RlZmdoaWpzdHV2d3h5eoOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3' +
    'uLm6wsPExcbHyMnK0tPU1dbX2Nna4eLj5OXm5+jp6vHy8/T19vf4+fr/xAAfAQADAQEBAQEBAQEB' +
    'AAAAAAAAAQIDBAUGBwgJCgv/xAC1EQACAQIEBAMEBwUEBAABAncAAQIDEQQFITEGEkFRB2FxEyIy' +
    'gQgUQpGhscEJIzNS8BVictEKFiQ04SXxFxgZGiYnKCkqNTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNk' +
    'ZWZnaGlqc3R1dnd4eXqCg4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfI' +
    'ycrS09TV1tfY2dri4+Tl5ufo6ery8/T19vf4+fr/2gAMAwEAAhEDEQA/APi+iiiv5TP9/AooooAK' +
    'KKKACusrk66yvYyn7Xy/U+dz/wD5d/P9D78ooor+Qz/h5CiiigAooooAKKKKAPzXooor+pD/ALqA' +
    'ooooAKKKKACusrk66yvYyn7Xy/U+dz//AJd/P9D78ooor+Qz/h5CiiigAooooAKKKKAPzXooor+p' +
    'D/uoCiiigAooooAK6yuTrrK9jKftfL9T53P/APl38/0Pvyiiiv5DP+HkKKKKACiiigAooooA+D6K' +
    '4eiv66/tT+7+P/AP+3z/AFX/AOnv/kv/AATuKK4eij+1P7v4/wDAD/Vf/p7/AOS/8E7iiuHoo/tT' +
    '+7+P/AD/AFX/AOnv/kv/AATuKz62K8/ror4z2dtL38zmyzLvb83vWtbp6+Z+lFFFFfx6f8RgUUUU' +
    'AFFFFABRRRQB+DdFFFf9ph/qwFFFFABRRRQAUUUUAeF0UUV/gGfqgUUUUAFFFFABRRRQB7pRRRX+' +
    '/h+VhRRRQAUUUUAFFFFAHhdFFFf4Bn6oFFFFABRRRQAUUUUAe6UUUV/v4flYUUUUAFFFFABRRRQB' +
    '4XRRRX+AZ+qBRRRQAUUUUAFFFFAHulFFFf7+H5WFFFFABRRRQAUUUUAeF0UUV/gGfqgUUUUAFFFF' +
    'ABRRRQB//9k=';

  /**
   * Returns a 128x128 pixel JPEG as a byte array. The image consists of four solid-colored squares:
   * - Top-Left = Red
   * - Top-Right = Green
   * - Bottom-Left = Blue
   * - Bottom-Right = Black
   */
  export function fourSquaresJpeg(): Uint8Array {
    // Base64-decode the data
    return Uint8Array.from(atobPortable(fourSquaresJpegBase64), c => c.charCodeAt(0));
  }

  /**
   * Validates the image matches the test pattern from `fourSquaresJpeg()`
   * @param image Image to validate
   * @param threshold Margin of error. The default value is sufficient for the JPEG lossiness in the image, but may
   *    need to be raised for test cases that do multiple rounds of compression/decompression.
   * @param dimensions Dimensions of the test pattern (must be in top-left corner). Defaults to the dimensions of the
   *    `image` parameter.
   */
  export async function expectFourSquaresJpegAsync(image: FimImage, threshold = 0.002, dimensions?: FimDimensions):
      Promise<void> {
    dimensions = dimensions ?? image.dim;
    expect((await image.getPixelAsync(topLeft(dimensions))).distance(TestColors.red)).toBeLessThan(threshold);
    expect((await image.getPixelAsync(topRight(dimensions))).distance(TestColors.green)).toBeLessThan(threshold);
    expect((await image.getPixelAsync(bottomLeft(dimensions))).distance(TestColors.blue)).toBeLessThan(threshold);
    expect((await image.getPixelAsync(bottomRight(dimensions))).distance(TestColors.black)).toBeLessThan(threshold);
  }

  /**
   * Validates the `CoreCanvas` matches the test pattern from `fourSquaresJpeg()`
   * @param canvas Canvas to validate
   * @param threshold Margin of error. The default value is sufficient for the JPEG lossiness in the image, but may
   *    need to be raised for test cases that do multiple rounds of compression/decompression.
   * @param dimensions Dimensions of the test pattern (must be in top-left corner). Defaults to the dimensions of the
   *    `canvas` parameter.
   */
  export async function expectFourSquaresJpegCanvasAsync(canvas: CoreCanvas, threshold = 0.002,
      dimensions?: FimDimensions): Promise<void> {
    dimensions = dimensions ?? canvas.dim;
    expect(canvas.getPixel(topLeft(dimensions)).distance(TestColors.red)).toBeLessThan(threshold);
    expect(canvas.getPixel(topRight(dimensions)).distance(TestColors.green)).toBeLessThan(threshold);
    expect(canvas.getPixel(bottomLeft(dimensions)).distance(TestColors.blue)).toBeLessThan(threshold);
    expect(canvas.getPixel(bottomRight(dimensions)).distance(TestColors.black)).toBeLessThan(threshold);
}

  /**
   * A Base64-encoded string containing a 128x128 pixel PNG. The image consists of four solid-colored squares:
   * - Top-Left = Red
   * - Top-Right = Green
   * - Bottom-Left = Blue
   * - Bottom-Right = Black
   */
  export const fourSquaresPngBase64 =
    'iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAIAAABMXPacAAAACXBIWXMAAAsTAAALEwEAmpwYAAAA' +
    'yklEQVR42u3TgQkAMBACMe3+O3/nEHIbSLCX7To+4EUAAAgAAAEAIAAABACAAAAQAAACAEAAAAgA' +
    'AAEAIAAABACAAAAQAAACAEAAAAgAAAEAIAAABACAAAAQAAACAEAAAAgAAAEAIAAABACAAAAQAABK' +
    'k9uf4AECAEAAAAgAAAEAIAAABACAAAAQAAACAEAAAAgAAAEAIAAABACAAAAAIAAABACAAAAQAAAC' +
    'AEAAAAgAAAEAIAAABACAAAAQAAACAEAAAAgAAAHY7gN6wgP+U5DwswAAAABJRU5ErkJggg==';

  /**
   * Returns a 128x128 pixel PNG as a byte array. The image consists of four solid-colored squares:
   * - Top-Left = Red
   * - Top-Right = Green
   * - Bottom-Left = Blue
   * - Bottom-Right = Black
   */
  export function fourSquaresPng(): Uint8Array {
    // Base64-decode the data
    return Uint8Array.from(atobPortable(fourSquaresPngBase64), c => c.charCodeAt(0));
  }

  /**
   * Validates the image matches the test pattern from `fourSquaresPng()`
   * @param image Image to validate
   * @param dimensions Dimensions of the test pattern (must be in top-left corner). Defaults to the dimensions of the
   *    `image` parameter.
   */
  export async function expectFourSquaresPngAsync(image: FimImage, dimensions?: FimDimensions): Promise<void> {
    dimensions = dimensions ?? image.dim;
    expect(await image.getPixelAsync(topLeft(dimensions))).toEqual(TestColors.red);
    expect(await image.getPixelAsync(topRight(dimensions))).toEqual(TestColors.green);
    expect(await image.getPixelAsync(bottomLeft(dimensions))).toEqual(TestColors.blue);
    expect(await image.getPixelAsync(bottomRight(dimensions))).toEqual(TestColors.black);
  }

  /**
   * Validates the `CoreCanvas` matches the test pattern from `fourSquaresPng()`
   * @param canvas Canvas to validate
   * @param dimensions Dimensions of the test pattern (must be in top-left corner). Defaults to the dimensions of the
   *    `canvas` parameter.
   */
  export async function expectFourSquaresPngCanvasAsync(canvas: CoreCanvas, dimensions?: FimDimensions): Promise<void> {
    dimensions = dimensions ?? canvas.dim;
    expect(canvas.getPixel(topLeft(dimensions))).toEqual(TestColors.red);
    expect(canvas.getPixel(topRight(dimensions))).toEqual(TestColors.green);
    expect(canvas.getPixel(bottomLeft(dimensions))).toEqual(TestColors.blue);
    expect(canvas.getPixel(bottomRight(dimensions))).toEqual(TestColors.black);
  }

  /**
   * Validates the RGBA pixel data matches the test pattern from `fourSquaresPng()`
   * @param data 8BPP pixel data, as an RGBA byte array
   * @param dimensions Dimensions of the test pattern (must be in top-left corner). Defaults to the dimensions of the
   *    `canvas` parameter.
   */
  export async function expectFourSquaresPngPixelDataAsync(data: Uint8ClampedArray, dimensions: FimDimensions):
      Promise<void> {
    expect(data.length).toEqual(expectedPixelDataLength(dimensions));
    expect(getPixelFromPixelData(data, dimensions, topLeft(dimensions))).toEqual(TestColors.red);
    expect(getPixelFromPixelData(data, dimensions, topRight(dimensions))).toEqual(TestColors.green);
    expect(getPixelFromPixelData(data, dimensions, bottomLeft(dimensions))).toEqual(TestColors.blue);
    expect(getPixelFromPixelData(data, dimensions, bottomRight(dimensions))).toEqual(TestColors.black);
  }


  /**
   * Returns an array of RGBA pixel data with a solid color
   * @param dimensions Output dimensions, in pixels
   * @param color Color to fill
   */
  export function solidPixelData(dimensions: FimDimensions, color: FimColor | string): Uint8ClampedArray {
    // Ensure color is a FimColor object
    color = FimColor.fromColorOrString(color);

    const result = new Uint8ClampedArray(dimensions.getArea() * 4);
    for (let y = 0; y < dimensions.h; y++) {
      const yOffset = y * dimensions.w;
      for (let x = 0; x < dimensions.w; x++) {
        const offset = (yOffset + x) * 4;
        result[offset] = color.r;
        result[offset + 1] = color.g;
        result[offset + 2] = color.b;
        result[offset + 3] = color.a;
      }
    }

    return result;
  }
}
