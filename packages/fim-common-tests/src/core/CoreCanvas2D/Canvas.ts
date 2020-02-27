// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { blue, green, red, small, smallMidpoint } from '../../common/Globals';
import { TestImages } from '../../common/TestImages';
import { FimDimensions } from '@leosingleton/fim';
import { CoreCanvas2D } from '@leosingleton/fim/build/internal';

/** CoreCanvas2D test cases around canvases */
export function coreCanvas2DTestSuiteCanvas(
  description: string,
  factory: (dimensions: FimDimensions, imageHandle: string) => CoreCanvas2D
): void {
  describe(description, () => {

    it('Gets and sets pixels', async () => {
      const canvas = factory(small, `${description} - Gets and sets pixels`);
      const pixelData = TestImages.solidPixelData(small, red);
      await canvas.loadPixelDataAsync(pixelData);
      expect(canvas.getPixel(smallMidpoint)).toEqual(red);
      canvas.dispose();
    });

    it('Fills with solid colors', () => {
      const canvas = factory(small, `${description} - Fills with solid colors`);
      canvas.fillCanvas(green);
      expect(canvas.getPixel(smallMidpoint)).toEqual(green);
      canvas.dispose();
    });

    it('Copies from one canvas to another', () => {
      const canvas1 = factory(small, `${description} - Copies from one canvas to another`);
      canvas1.fillCanvas(blue);

      const canvas2 = factory(small, `${description} - Copies from one canvas to another`);
      canvas2.copyFrom(canvas1);
      expect(canvas2.getPixel(smallMidpoint)).toEqual(blue);

      canvas1.dispose();
      canvas2.dispose();
    });

  });
}
