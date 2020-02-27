// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { green, midpoint, small } from '../../common/Globals';
import { FimDimensions } from '@leosingleton/fim';
import { CoreCanvasWebGL } from '@leosingleton/fim/build/internal';

/** CoreCanvasWebGL test cases for canvas operations */
export function coreCanvasWebGLTestSuiteCanvas(
  description: string,
  factory: (dimensions: FimDimensions, imageHandle: string) => CoreCanvasWebGL
): void {
  describe(description, () => {

    it('Fills with solid colors', () => {
      const canvas = factory(small, `${description} - Fills with solid colors`);
      canvas.fillCanvas(green);
      expect(canvas.getPixel(midpoint(small))).toEqual(green);
      canvas.dispose();
    });

  });
}
