// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { canvasOptions } from '../../common/CoreOptions';
import { bottomLeft, bottomRight, medium, smallFourSquares, topLeft, topRight } from '../../common/Globals';
import { TestColors } from '../../common/TestColors';
import { TestImages } from '../../common/TestImages';
import { usingAsync } from '@leosingleton/commonlibs';
import { FimDimensions } from '@leosingleton/fim';
import { CoreCanvas2D, CoreCanvasOptions } from '@leosingleton/fim/internals';

/** CoreCanvas2D test cases for PNG and JPEG support */
export function coreCanvas2DTestSuitePngJpeg(
  description: string,
  factory: (canvasOptions: CoreCanvasOptions, dimensions: FimDimensions) => CoreCanvas2D
): void {
  describe(`CoreCanvas2D PNG/JPEG - ${description}`, () => {

    it('Imports from PNG', async () => {
      await usingAsync(factory(canvasOptions, smallFourSquares), async canvas => {
        const png = TestImages.fourSquaresPng();
        await canvas.loadFromPngAsync(png);

        expect(canvas.getPixel(topLeft())).toEqual(TestColors.red);
        expect(canvas.getPixel(topRight())).toEqual(TestColors.green);
        expect(canvas.getPixel(bottomLeft())).toEqual(TestColors.blue);
        expect(canvas.getPixel(bottomRight())).toEqual(TestColors.black);
      });
    });

    it('Imports from JPEG', async () => {
      await usingAsync(factory(canvasOptions, smallFourSquares), async canvas => {
        const jpeg = TestImages.fourSquaresJpeg();
        await canvas.loadFromJpegAsync(jpeg);

        expect(canvas.getPixel(topLeft()).distance(TestColors.red)).toBeLessThan(0.002);
        expect(canvas.getPixel(topRight()).distance(TestColors.green)).toBeLessThan(0.002);
        expect(canvas.getPixel(bottomLeft()).distance(TestColors.blue)).toBeLessThan(0.002);
        expect(canvas.getPixel(bottomRight()).distance(TestColors.black)).toBeLessThan(0.002);
      });
    });

    it('Imports from PNG with rescale', async () => {
      await usingAsync(factory(canvasOptions, medium), async canvas => {
        const png = TestImages.fourSquaresPng();
        await canvas.loadFromPngAsync(png, true);

        expect(canvas.getPixel(topLeft(medium))).toEqual(TestColors.red);
        expect(canvas.getPixel(topRight(medium))).toEqual(TestColors.green);
        expect(canvas.getPixel(bottomLeft(medium))).toEqual(TestColors.blue);
        expect(canvas.getPixel(bottomRight(medium))).toEqual(TestColors.black);
      });
    });

    it('Imports from JPEG with rescale', async () => {
      await usingAsync(factory(canvasOptions, medium), async canvas => {
        const jpeg = TestImages.fourSquaresJpeg();
        await canvas.loadFromJpegAsync(jpeg, true);

        expect(canvas.getPixel(topLeft(medium)).distance(TestColors.red)).toBeLessThan(0.002);
        expect(canvas.getPixel(topRight(medium)).distance(TestColors.green)).toBeLessThan(0.002);
        expect(canvas.getPixel(bottomLeft(medium)).distance(TestColors.blue)).toBeLessThan(0.002);
        expect(canvas.getPixel(bottomRight(medium)).distance(TestColors.black)).toBeLessThan(0.002);
      });
    });

  });
}
