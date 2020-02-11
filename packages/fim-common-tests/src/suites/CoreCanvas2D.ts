// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimDimensions, FimColor } from '@leosingleton/fim';
import { CoreCanvas2D } from '@leosingleton/fim/build/internal';

/**
 * Executes a suite of common tests using the CoreCanvas2D objects created via factory methods
 * @param description Description to show in the test framework
 * @param factory Lambda to create the CoreCanvas instance
 */
export function coreCanvas2D(
  description: string,
  factory: (dimensions: FimDimensions, imageHandle: string) => CoreCanvas2D
): void {
  describe(description, () => {

    it('Creates and disposes', () => {
      const canvas = factory(FimDimensions.fromWidthHeight(100, 100), `${description} - Creates and disposes`);
      canvas.dispose();
    });

    it('Gets and sets pixels', () => {
      const canvas = factory(FimDimensions.fromWidthHeight(100, 100), `${description} - Gets and sets pixels`);
      canvas.setPixel(50, 50, FimColor.fromString('#f0f'));
      const color = canvas.getPixel(50, 50);
      expect(color.r).toEqual(255);
      expect(color.g).toEqual(0);
      expect(color.b).toEqual(255);
      expect(color.a).toEqual(255);
      canvas.dispose();
    });

    it('Fills with solid colors', () => {
      const canvas = factory(FimDimensions.fromWidthHeight(100, 100), `${description} - Fills with solid colors`);
      canvas.fillCanvas(FimColor.fromString('#0f0'));
      const color = canvas.getPixel(50, 50);
      expect(color.r).toEqual(0);
      expect(color.g).toEqual(255);
      expect(color.b).toEqual(0);
      expect(color.a).toEqual(255);
      canvas.dispose();
    });

  });
}
