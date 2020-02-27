// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { green, midpoint, small } from '../../common/Globals';
import { using } from '@leosingleton/commonlibs';
import { FimDimensions } from '@leosingleton/fim';
import { CoreCanvasWebGL } from '@leosingleton/fim/build/internal';

/** CoreCanvasWebGL test cases for canvas operations */
export function coreCanvasWebGLTestSuiteCanvas(
  description: string,
  factory: (dimensions: FimDimensions) => CoreCanvasWebGL
): void {
  describe(`CoreCanvasWebGL Canvas - ${description}`, () => {

    it('Fills with solid colors', () => {
      using(factory(small), canvas => {
        canvas.fillCanvas(green);
        expect(canvas.getPixel(midpoint(small))).toEqual(green);
      });
    });

  });
}
