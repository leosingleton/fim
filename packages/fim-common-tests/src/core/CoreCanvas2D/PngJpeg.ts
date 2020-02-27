// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { black, blue, green, medium, red, smallFourSquares } from '../../common/Globals';
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
