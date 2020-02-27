// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { TestImages } from '../../common/TestImages';
import { FimDimensions, FimColor } from '@leosingleton/fim';
import { CoreCanvas2D } from '@leosingleton/fim/build/internal';

/** Small 100x100 canvas dimensions */
const small = FimDimensions.fromWidthHeight(100, 100);

/** Small 128x128 canvas dimensions, used by four squares sample image */
const smallFourSquares = FimDimensions.fromWidthHeight(128, 128);

/** Medium 500x500 canvas dimensions */
const medium = FimDimensions.fromWidthHeight(500, 500);

const red = FimColor.fromString('#f00');
const green = FimColor.fromString('#0f0');
const blue = FimColor.fromString('#00f');
const black = FimColor.fromString('#000');

/**
 * Executes a suite of common tests using the CoreCanvas2D objects created via factory methods
 * @param description Description to show in the test framework
 * @param factory Lambda to create the CoreCanvas2D instance
 */
export function coreCanvas2D(
  description: string,
  factory: (dimensions: FimDimensions, imageHandle: string) => CoreCanvas2D
): void {
  describe(description, () => {

    it('Creates and disposes', () => {
      const canvas = factory(small, `${description} - Creates and disposes`);
      canvas.dispose();
    });

    it('Gets and sets pixels', async () => {
      const canvas = factory(small, `${description} - Gets and sets pixels`);
      const pixelData = TestImages.solidPixelData(small, red);
      await canvas.loadPixelDataAsync(pixelData);
      expect(canvas.getPixel(50, 50)).toEqual(red);
      canvas.dispose();
    });

    it('Fills with solid colors', () => {
      const canvas = factory(small, `${description} - Fills with solid colors`);
      canvas.fillCanvas(green);
      expect(canvas.getPixel(50, 50)).toEqual(green);
      canvas.dispose();
    });

    it('Copies from one canvas to another', () => {
      const canvas1 = factory(small, `${description} - Copies from one canvas to another`);
      canvas1.fillCanvas(blue);

      const canvas2 = factory(small, `${description} - Copies from one canvas to another`);
      canvas2.copyFrom(canvas1);
      expect(canvas2.getPixel(50, 50)).toEqual(blue);

      canvas1.dispose();
      canvas2.dispose();
    });

    it('Imports from PNG', async () => {
      const canvas = factory(smallFourSquares, `${description} - Imports from PNG`);
      const png = TestImages.fourSquaresPng();
      await canvas.loadFromPngAsync(png);

      expect(canvas.getPixel(32, 32).distance(red)).toEqual(0);
      expect(canvas.getPixel(96, 32).distance(green)).toEqual(0);
      expect(canvas.getPixel(32, 96).distance(blue)).toEqual(0);
      expect(canvas.getPixel(96, 96).distance(black)).toEqual(0);

      canvas.dispose();
    });

    it('Imports from JPEG', async () => {
      const canvas = factory(smallFourSquares, `${description} - Imports from JPEG`);
      const jpeg = TestImages.fourSquaresJpeg();
      await canvas.loadFromJpegAsync(jpeg);

      expect(canvas.getPixel(32, 32).distance(red)).toBeLessThan(0.002);
      expect(canvas.getPixel(96, 32).distance(green)).toBeLessThan(0.002);
      expect(canvas.getPixel(32, 96).distance(blue)).toBeLessThan(0.002);
      expect(canvas.getPixel(96, 96).distance(black)).toBeLessThan(0.002);

      canvas.dispose();
    });

    it('Imports from PNG with rescale', async () => {
      const canvas = factory(medium, `${description} - Imports from PNG with rescale`);
      const png = TestImages.fourSquaresPng();
      await canvas.loadFromPngAsync(png, true);

      expect(canvas.getPixel(125, 125).distance(red)).toEqual(0);
      expect(canvas.getPixel(375, 125).distance(green)).toEqual(0);
      expect(canvas.getPixel(125, 375).distance(blue)).toEqual(0);
      expect(canvas.getPixel(375, 375).distance(black)).toEqual(0);

      canvas.dispose();
    });

    it('Imports from JPEG with rescale', async () => {
      const canvas = factory(medium, `${description} - Imports from JPEG with rescale`);
      const jpeg = TestImages.fourSquaresJpeg();
      await canvas.loadFromJpegAsync(jpeg, true);

      expect(canvas.getPixel(125, 125).distance(red)).toBeLessThan(0.002);
      expect(canvas.getPixel(375, 125).distance(green)).toBeLessThan(0.002);
      expect(canvas.getPixel(125, 375).distance(blue)).toBeLessThan(0.002);
      expect(canvas.getPixel(375, 375).distance(black)).toBeLessThan(0.002);

      canvas.dispose();
    });

  });
}
