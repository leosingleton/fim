// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimColor, FimDimensions } from '@leosingleton/fim';
import { CoreCanvasWebGL } from '@leosingleton/fim/build/internal';

/**
 * Executes a suite of common tests using the CoreCanvasWebGL objects created via factory methods
 * @param description Description to show in the test framework
 * @param factory Lambda to create the CoreCanvasWebGL instance
 */
export function coreCanvasWebGL(
  description: string,
  factory: (dimensions: FimDimensions, imageHandle: string) => CoreCanvasWebGL
): void {
  describe(description, () => {

    it('Creates and disposes', () => {
      const canvas = factory(FimDimensions.fromWidthHeight(100, 100), `${description} - Creates and disposes`);
      canvas.dispose();
    });

    it('Fills with solid colors', () => {
      const canvas = factory(FimDimensions.fromWidthHeight(100, 100), `${description} - Fills with solid colors`);
      const color = FimColor.fromString('#0f0');
      canvas.fillCanvas(color);
      expect(canvas.getPixel(50, 50)).toEqual(color);
      canvas.dispose();
    });

  });
}
