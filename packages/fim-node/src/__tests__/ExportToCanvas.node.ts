// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimNodeFactory } from '../factory/FimNodeFactory';
import { usingAsync } from '@leosingleton/commonlibs';
import { FimColor, FimDimensions, FimError, FimRect } from '@leosingleton/fim';
import { TestColors, TestImages, TestSizes, expectErrorAsync } from '@leosingleton/fim-common-tests';
import { Canvas, CanvasRenderingContext2D, createCanvas } from 'canvas';

/**
 * Helper function to create a canvas
 * @param dimensions Canvas dimensions
 * @param color Canvas fill color
 */
function createCanvasAndFill(dimensions: FimDimensions, color: FimColor): Canvas {
  const canvas = createCanvas(dimensions.w, dimensions.h);

  const ctx = canvas.getContext('2d');
  ctx.beginPath();
  ctx.rect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = color.string;
  ctx.fill();

  return canvas;
}

/** Disposes a canvas created by `createCanvasAndFill()` */
function disposeCanvas(canvas: Canvas): void {
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
    await usingAsync(FimNodeFactory.create(), async fim => {
      // Create a FIM image and fill it with blue
      const image = fim.createImage(TestSizes.mediumSquare, { defaultFillColor: TestColors.blue });

      // Create a 100x100 canvas and fill with red
      const canvas = createCanvasAndFill(FimDimensions.fromSquareDimension(100), TestColors.red);

      try {
        // Copy the FIM image to the top-left corner of the canvas
        await image.exportToCanvasAsync(canvas, undefined, FimRect.fromXYWidthHeight(0, 0, 50, 50));

        // Check a few pixels of the canvas
        const context = canvas.getContext('2d');
        expect(getPixel(context, 25, 25)).toEqual(TestColors.blue);
        expect(getPixel(context, 25, 75)).toEqual(TestColors.red);
        expect(getPixel(context, 75, 25)).toEqual(TestColors.red);
        expect(getPixel(context, 75, 75)).toEqual(TestColors.red);
      } finally {
        disposeCanvas(canvas);
      }
    });
  });

  it('exportToCanvasAsync() with downscale', async () => {
    await usingAsync(FimNodeFactory.create(), async fim => {
      const dim = FimDimensions.fromWidthHeight(302, 298);

      // Create a FIM image and fill it with blue
      const image = fim.createImage(dim, { defaultFillColor: TestColors.blue });

      // Create an oversized canvas and fill with red
      const canvas = createCanvasAndFill(dim, TestColors.red);
      try {
        // Copy the FIM image to the canvas
        await image.exportToCanvasAsync(canvas);

        // Check a few pixels of the canvas
        const context = canvas.getContext('2d');
        expect(getPixel(context, 0, 0)).toEqual(TestColors.blue);
        expect(getPixel(context, 0, dim.h - 1)).toEqual(TestColors.blue);
        expect(getPixel(context, dim.w - 1, 0)).toEqual(TestColors.blue);
        expect(getPixel(context, dim.w - 1, dim.h - 1)).toEqual(TestColors.blue);
      } finally {
        disposeCanvas(canvas);
      }
    });
  });

  it('exportToCanvasAsync() with allowOversizedDest', async () => {
    await usingAsync(FimNodeFactory.create(), async fim => {
      // Load the four squares test pattern (128x128)
      const image = await fim.createImageFromPngAsync(TestImages.fourSquaresPng());

      // Create a canvas
      const canvas = createCanvasAndFill(TestSizes.smallSquare, TestColors.white);
      try {
        // Copy the FIM image to the canvas. Set the destCoords such that the image is cropped to the top-right (green)
        const destCoords = FimRect.fromXYWidthHeight(-128, 0, 256, 256);
        await image.exportToCanvasAsync(canvas, undefined, destCoords, true);

        // Check a few pixels of the canvas
        const context = canvas.getContext('2d');
        expect(getPixel(context, 1, 1)).toEqual(TestColors.green);
        expect(getPixel(context, 1, 126)).toEqual(TestColors.green);
        expect(getPixel(context, 126, 1)).toEqual(TestColors.green);
        expect(getPixel(context, 126, 126)).toEqual(TestColors.green);
      } finally {
        disposeCanvas(canvas);
      }
    });
  });

  it('exportToCanvasAsync() fails without allowOversizedDest', async () => {
    await usingAsync(FimNodeFactory.create(), async fim => {
      // Create a test image
      const image = fim.createImage(TestSizes.smallTall, { defaultFillColor: TestColors.blue });

      // Create a canvas
      const canvas = createCanvasAndFill(TestSizes.smallTall, TestColors.yellow);
      try {
        // Try destCoords that exceed the canvas (32x128). We expect a FimError.
        const destCoords = FimRect.fromXYWidthHeight(0, 0, 33, 33);
        (await expectErrorAsync(image.exportToCanvasAsync(canvas, undefined, destCoords))).toBeInstanceOf(FimError);
      } finally {
        disposeCanvas(canvas);
      }
    });
  });

});
