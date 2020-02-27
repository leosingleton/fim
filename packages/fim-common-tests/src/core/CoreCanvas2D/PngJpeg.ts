// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { black, blue, bottomLeft, bottomRight, green, medium, red, smallFourSquares, topLeft,
  topRight } from '../../common/Globals';
import { TestImages } from '../../common/TestImages';
import { FimDimensions } from '@leosingleton/fim';
import { CoreCanvas2D } from '@leosingleton/fim/build/internal';

/** CoreCanvas2D test cases for PNG and JPEG support */
export function coreCanvas2DTestSuitePngJpeg(
  description: string,
  factory: (dimensions: FimDimensions, imageHandle: string) => CoreCanvas2D
): void {
  describe(`${description} - PNG/JPEG`, () => {

    it('Imports from PNG', async () => {
      const canvas = factory(smallFourSquares, `${description} - Imports from PNG`);
      const png = TestImages.fourSquaresPng();
      await canvas.loadFromPngAsync(png);

      expect(canvas.getPixel(topLeft()).distance(red)).toEqual(0);
      expect(canvas.getPixel(topRight()).distance(green)).toEqual(0);
      expect(canvas.getPixel(bottomLeft()).distance(blue)).toEqual(0);
      expect(canvas.getPixel(bottomRight()).distance(black)).toEqual(0);

      canvas.dispose();
    });

    it('Imports from JPEG', async () => {
      const canvas = factory(smallFourSquares, `${description} - Imports from JPEG`);
      const jpeg = TestImages.fourSquaresJpeg();
      await canvas.loadFromJpegAsync(jpeg);

      expect(canvas.getPixel(topLeft()).distance(red)).toBeLessThan(0.002);
      expect(canvas.getPixel(topRight()).distance(green)).toBeLessThan(0.002);
      expect(canvas.getPixel(bottomLeft()).distance(blue)).toBeLessThan(0.002);
      expect(canvas.getPixel(bottomRight()).distance(black)).toBeLessThan(0.002);

      canvas.dispose();
    });

    it('Imports from PNG with rescale', async () => {
      const canvas = factory(medium, `${description} - Imports from PNG with rescale`);
      const png = TestImages.fourSquaresPng();
      await canvas.loadFromPngAsync(png, true);

      expect(canvas.getPixel(topLeft(medium)).distance(red)).toEqual(0);
      expect(canvas.getPixel(topRight(medium)).distance(green)).toEqual(0);
      expect(canvas.getPixel(bottomLeft(medium)).distance(blue)).toEqual(0);
      expect(canvas.getPixel(bottomRight(medium)).distance(black)).toEqual(0);

      canvas.dispose();
    });

    it('Imports from JPEG with rescale', async () => {
      const canvas = factory(medium, `${description} - Imports from JPEG with rescale`);
      const jpeg = TestImages.fourSquaresJpeg();
      await canvas.loadFromJpegAsync(jpeg, true);

      expect(canvas.getPixel(topLeft(medium)).distance(red)).toBeLessThan(0.002);
      expect(canvas.getPixel(topRight(medium)).distance(green)).toBeLessThan(0.002);
      expect(canvas.getPixel(bottomLeft(medium)).distance(blue)).toBeLessThan(0.002);
      expect(canvas.getPixel(bottomRight(medium)).distance(black)).toBeLessThan(0.002);

      canvas.dispose();
    });

  });
}
