// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimBrowserFactory } from '../factory/FimBrowserFactory';
import { usingAsync } from '@leosingleton/commonlibs';
import { FimColor, FimDimensions, FimRect } from '@leosingleton/fim';

/** Tiny dimensions for unit test */
const tiny = FimDimensions.fromWidthHeight(100, 100);

/** Small dimensions for unit test */
const small = FimDimensions.fromWidthHeight(200, 200);

const red = FimColor.fromString('#f00');
const blue = FimColor.fromString('#00f');

/**
 * Helper function to create a canvas
 * @param dimensions Canvas dimensions
 * @param color Canvas fill color
 */
function createCanvasAndFill(dimensions: FimDimensions, color: FimColor): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = dimensions.w;
  canvas.height = dimensions.h;
  canvas.style.display = 'none';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  ctx.beginPath();
  ctx.rect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = color.string;
  ctx.fill();

  return canvas;
}

/** Disposes a canvas created by `createCanvasAndFill()` */
function disposeCanvas(canvas: HTMLCanvasElement): void {
  document.body.removeChild(canvas);
  canvas.width = 0;
  canvas.height = 0;
}

/**
 * Reads the color of a pixel from a canvas
 * @param context Canvas rendering context
 * @param x X-coordinate, in pixels
 * @param y Y-coordinate, in pixels
 * @returns Pixel color, as a `FimColor`
 */
function getPixel(context: CanvasRenderingContext2D, x: number, y: number): FimColor {
  const pixel = context.getImageData(x, y, 1, 1).data;
  return FimColor.fromRGBABytes(pixel[0], pixel[1], pixel[2], pixel[3]);
}

describe('Exports to Canvas', () => {

  it('exportToCanvasAsync()', async () => {
    await usingAsync(FimBrowserFactory.create(small), async fim => {
      // Create a FIM image and fill it with blue
      const image = fim.createImage();
      await image.fillSolidAsync(blue);

      // Create an HTML canvas and fill with red
      const canvas = createCanvasAndFill(tiny, red);
      try {
        // Copy the FIM image to the top-left corner of the canvas
        await image.exportToCanvasAsync(canvas, undefined, FimRect.fromXYWidthHeight(0, 0, 50, 50));

        // Check a few pixels of the canvas
        const context = canvas.getContext('2d');
        expect(getPixel(context, 25, 25)).toEqual(blue);
        expect(getPixel(context, 25, 75)).toEqual(red);
        expect(getPixel(context, 75, 25)).toEqual(red);
        expect(getPixel(context, 75, 75)).toEqual(red);
      } finally {
        disposeCanvas(canvas);
      }
    });
  });

});
