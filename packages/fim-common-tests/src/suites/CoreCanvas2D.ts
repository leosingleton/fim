// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { TestImages } from '../misc/TestImages';
import { FimDimensions, FimColor } from '@leosingleton/fim';
import { CoreCanvas2D } from '@leosingleton/fim/build/internal';

/** Small 100x100 canvas dimensions */
const small = FimDimensions.fromWidthHeight(100, 100);

const red = FimColor.fromString('#f00');
const green = FimColor.fromString('#0f0');
const blue = FimColor.fromString('#00f');

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
      const canvas1 = factory(small,
        `${description} - Copies from one canvas to another`);
      canvas1.fillCanvas(blue);

      const canvas2 = factory(small,
        `${description} - Copies from one canvas to another`);
      canvas2.copyFrom(canvas1);
      expect(canvas2.getPixel(50, 50)).toEqual(blue);

      canvas1.dispose();
      canvas2.dispose();
    });

  });
}
