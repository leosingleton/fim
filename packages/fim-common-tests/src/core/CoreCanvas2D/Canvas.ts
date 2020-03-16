// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { blue, green, midpoint, red, small, smallFourSquares } from '../../common/Globals';
import { TestImages } from '../../common/TestImages';
import { using, usingAsync } from '@leosingleton/commonlibs';
import { FimDimensions, FimRect } from '@leosingleton/fim';
import { CoreCanvas2D } from '@leosingleton/fim/internals';

/** CoreCanvas2D test cases around canvases */
export function coreCanvas2DTestSuiteCanvas(
  description: string,
  factory: (dimensions: FimDimensions) => CoreCanvas2D
): void {
  describe(`CoreCanvas2D Canvas - ${description}`, () => {

    it('Gets and sets pixels', async () => {
      await usingAsync(factory(small), async canvas => {
        const pixelData = TestImages.solidPixelData(small, red);
        await canvas.loadPixelDataAsync(pixelData);
        expect(canvas.getPixel(midpoint(small))).toEqual(red);
      });
    });

    it('Fills with solid colors', () => {
      using(factory(small), canvas => {
        canvas.fillSolid(green);
        expect(canvas.getPixel(midpoint(small))).toEqual(green);
      });
    });

    it('Copies from one canvas to another', async () => {
      await usingAsync(factory(small), async canvas1 => {
        canvas1.fillSolid(blue);

        await usingAsync(factory(small), async canvas2 => {
          await canvas2.copyFromAsync(canvas1);
          expect(canvas2.getPixel(midpoint(small))).toEqual(blue);
        });
      });
    });

    it('Exports to pixel data', () => {
      using(factory(small), canvas => {
        canvas.fillSolid(red);
        const data = canvas.exportToPixelData();

        expect(data.length).toEqual(small.getArea() * 4);
        expect(data[0]).toEqual(255); // R
        expect(data[1]).toEqual(0);   // G
        expect(data[2]).toEqual(0);   // B
        expect(data[3]).toEqual(255); // A
      });
    });

    it('Exports a region to pixel data', async () => {
      await usingAsync(factory(smallFourSquares), async canvas => {
        // Load the four squares test pattern
        await canvas.loadFromPngAsync(TestImages.fourSquaresPng());

        // Export only the bottom-left corner (blue)
        const srcCoords = FimRect.fromXYWidthHeight(0, smallFourSquares.h / 2, smallFourSquares.w / 2,
          smallFourSquares.h / 2);
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