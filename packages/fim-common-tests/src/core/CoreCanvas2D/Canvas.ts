// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { blue, green, midpoint, red, small } from '../../common/Globals';
import { TestImages } from '../../common/TestImages';
import { using, usingAsync } from '@leosingleton/commonlibs';
import { FimDimensions } from '@leosingleton/fim';
import { CoreCanvas2D } from '@leosingleton/fim/build/internal';

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
        canvas.fillCanvas(green);
        expect(canvas.getPixel(midpoint(small))).toEqual(green);
      });
    });

    it('Copies from one canvas to another', () => {
      using(factory(small), canvas1 => {
        canvas1.fillCanvas(blue);

        using(factory(small), canvas2 => {
          canvas2.copyFrom(canvas1);
          expect(canvas2.getPixel(midpoint(small))).toEqual(blue);
        });
      });
    });

  });
}
