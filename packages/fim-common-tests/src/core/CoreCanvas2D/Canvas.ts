// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { canvasOptions } from '../../common/CoreOptions';
import { midpoint } from '../../common/Globals';
import { TestColors } from '../../common/TestColors';
import { TestImages } from '../../common/TestImages';
import { TestSizes } from '../../common/TestSizes';
import { using, usingAsync } from '@leosingleton/commonlibs';
import { FimDimensions, FimRect } from '@leosingleton/fim';
import { CoreCanvas2D, CoreCanvasOptions,  } from '@leosingleton/fim/internals';

/** CoreCanvas2D test cases around canvases */
export function coreCanvas2DTestSuiteCanvas(
  description: string,
  factory: (canvasOptions: CoreCanvasOptions, dimensions: FimDimensions) => CoreCanvas2D
): void {
  describe(`CoreCanvas2D Canvas - ${description}`, () => {

    it('Gets and sets pixels', async () => {
      await usingAsync(factory(canvasOptions, TestSizes.smallWide), async canvas => {
        const pixelData = TestImages.solidPixelData(TestSizes.smallWide, TestColors.red);
        await canvas.loadPixelDataAsync(pixelData);
        expect(canvas.getPixel(midpoint(TestSizes.smallWide))).toEqual(TestColors.red);
      });
    });

    it('Fills with solid colors', () => {
      using(factory(canvasOptions, TestSizes.smallWide), canvas => {
        canvas.fillSolid(TestColors.green);
        expect(canvas.getPixel(midpoint(TestSizes.smallWide))).toEqual(TestColors.green);
      });
    });

    it('Copies from one canvas to another', async () => {
      await usingAsync(factory(canvasOptions, TestSizes.smallWide), async canvas1 => {
        canvas1.fillSolid(TestColors.blue);

        await usingAsync(factory(canvasOptions, TestSizes.smallWide), async canvas2 => {
          await canvas2.copyFromAsync(canvas1);
          expect(canvas2.getPixel(midpoint(TestSizes.smallWide))).toEqual(TestColors.blue);
        });
      });
    });

    it('Exports to pixel data', () => {
      using(factory(canvasOptions, TestSizes.smallWide), canvas => {
        canvas.fillSolid(TestColors.red);
        const data = canvas.exportToPixelData();

        expect(data.length).toEqual(TestSizes.smallWide.getArea() * 4);
        expect(data[0]).toEqual(255); // R
        expect(data[1]).toEqual(0);   // G
        expect(data[2]).toEqual(0);   // B
        expect(data[3]).toEqual(255); // A
      });
    });

    it('Exports a region to pixel data', async () => {
      await usingAsync(factory(canvasOptions, TestSizes.smallSquare), async canvas => {
        // Load the four squares test pattern
        await canvas.loadFromPngAsync(TestImages.fourSquaresPng());

        // Export only the bottom-left corner (blue)
        const srcCoords = FimRect.fromXYWidthHeight(0, TestSizes.smallSquare.h / 2, TestSizes.smallSquare.w / 2,
          TestSizes.smallSquare.h / 2);
        const data = canvas.exportToPixelData(srcCoords);

        expect(data.length).toEqual(srcCoords.getArea() * 4);
        expect(data[0]).toEqual(0);   // R
        expect(data[1]).toEqual(0);   // G
        expect(data[2]).toEqual(255); // B
        expect(data[3]).toEqual(255); // A
      });
    });

  });
}
