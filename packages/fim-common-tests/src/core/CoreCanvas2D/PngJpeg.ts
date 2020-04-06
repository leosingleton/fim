// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { canvasOptions } from '../../common/CoreOptions';
import { TestImages } from '../../common/TestImages';
import { TestSizes } from '../../common/TestSizes';
import { usingAsync } from '@leosingleton/commonlibs';
import { FimDimensions } from '@leosingleton/fim';
import { CoreCanvas2D, CoreCanvasOptions } from '@leosingleton/fim/internals';

/** CoreCanvas2D test cases for PNG and JPEG support */
export function coreCanvas2DTestSuitePngJpeg(
  description: string,
  factory: (dimensions: FimDimensions, canvasOptions: CoreCanvasOptions) => CoreCanvas2D
): void {
  describe(`CoreCanvas2D PNG/JPEG - ${description}`, () => {

    it('Imports from PNG', async () => {
      await usingAsync(factory(TestSizes.smallSquare, canvasOptions), async canvas => {
        const png = TestImages.fourSquaresPng();
        await canvas.loadFromPngAsync(png);
        await TestImages.expectFourSquaresPngCanvasAsync(canvas);
      });
    });

    it('Imports from JPEG', async () => {
      await usingAsync(factory(TestSizes.smallSquare, canvasOptions), async canvas => {
        const jpeg = TestImages.fourSquaresJpeg();
        await canvas.loadFromJpegAsync(jpeg);
        await TestImages.expectFourSquaresJpegCanvasAsync(canvas);
      });
    });

    it('Imports from PNG with rescale', async () => {
      await usingAsync(factory(TestSizes.mediumTall, canvasOptions), async canvas => {
        const png = TestImages.fourSquaresPng();
        await canvas.loadFromPngAsync(png);
        await TestImages.expectFourSquaresPngCanvasAsync(canvas);
      });
    });

    it('Imports from JPEG with rescale', async () => {
      await usingAsync(factory(TestSizes.mediumTall, canvasOptions), async canvas => {
        const jpeg = TestImages.fourSquaresJpeg();
        await canvas.loadFromJpegAsync(jpeg);
        await TestImages.expectFourSquaresJpegCanvasAsync(canvas);
      });
    });

  });
}
