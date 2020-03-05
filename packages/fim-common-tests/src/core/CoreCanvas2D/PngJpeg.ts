// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { black, blue, bottomLeft, bottomRight, green, medium, red, smallFourSquares, topLeft,
  topRight } from '../../common/Globals';
import { TestImages } from '../../common/TestImages';
import { usingAsync } from '@leosingleton/commonlibs';
import { FimDimensions } from '@leosingleton/fim';
import { CoreCanvas2D } from '@leosingleton/fim/internals';

/** CoreCanvas2D test cases for PNG and JPEG support */
export function coreCanvas2DTestSuitePngJpeg(
  description: string,
  factory: (dimensions: FimDimensions) => CoreCanvas2D
): void {
  describe(`CoreCanvas2D PNG/JPEG - ${description}`, () => {

    it('Imports from PNG', async () => {
      await usingAsync(factory(smallFourSquares), async canvas => {
        const png = TestImages.fourSquaresPng();
        await canvas.loadFromPngAsync(png);

        expect(canvas.getPixel(topLeft())).toEqual(red);
        expect(canvas.getPixel(topRight())).toEqual(green);
        expect(canvas.getPixel(bottomLeft())).toEqual(blue);
        expect(canvas.getPixel(bottomRight())).toEqual(black);
      });
    });

    it('Imports from JPEG', async () => {
      await usingAsync(factory(smallFourSquares), async canvas => {
        const jpeg = TestImages.fourSquaresJpeg();
        await canvas.loadFromJpegAsync(jpeg);

        expect(canvas.getPixel(topLeft()).distance(red)).toBeLessThan(0.002);
        expect(canvas.getPixel(topRight()).distance(green)).toBeLessThan(0.002);
        expect(canvas.getPixel(bottomLeft()).distance(blue)).toBeLessThan(0.002);
        expect(canvas.getPixel(bottomRight()).distance(black)).toBeLessThan(0.002);
      });
    });

    it('Imports from PNG with rescale', async () => {
      await usingAsync(factory(medium), async canvas => {
        const png = TestImages.fourSquaresPng();
        await canvas.loadFromPngAsync(png, true);

        expect(canvas.getPixel(topLeft(medium))).toEqual(red);
        expect(canvas.getPixel(topRight(medium))).toEqual(green);
        expect(canvas.getPixel(bottomLeft(medium))).toEqual(blue);
        expect(canvas.getPixel(bottomRight(medium))).toEqual(black);
      });
    });

    it('Imports from JPEG with rescale', async () => {
      await usingAsync(factory(medium), async canvas => {
        const jpeg = TestImages.fourSquaresJpeg();
        await canvas.loadFromJpegAsync(jpeg, true);

        expect(canvas.getPixel(topLeft(medium)).distance(red)).toBeLessThan(0.002);
        expect(canvas.getPixel(topRight(medium)).distance(green)).toBeLessThan(0.002);
        expect(canvas.getPixel(bottomLeft(medium)).distance(blue)).toBeLessThan(0.002);
        expect(canvas.getPixel(bottomRight(medium)).distance(black)).toBeLessThan(0.002);
      });
    });

  });
}
