// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { small } from '../../common/Globals';
import { FimDimensions } from '@leosingleton/fim';
import { CoreCanvas2D } from '@leosingleton/fim/internals';

/** CoreCanvas2D tests around create/dispose */
export function coreCanvas2DTestSuiteCreateDispose(
  description: string,
  factory: (dimensions: FimDimensions) => CoreCanvas2D
): void {
  describe(`CoreCanvas2D Create/Dispose - ${description}`, () => {

    it('Creates and disposes', () => {
      const canvas = factory(small);
      canvas.dispose();
      expect(() => canvas.dispose()).toThrow(); // Double dispose throws exception
    });

  });
}
