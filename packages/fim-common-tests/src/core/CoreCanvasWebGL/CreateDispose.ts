// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { small } from '../../common/Globals';
import { FimDimensions } from '@leosingleton/fim';
import { CoreCanvasWebGL } from '@leosingleton/fim/build/internal';

/** CoreCanvasWebGL test cases for create/dispose */
export function coreCanvasWebGLTestSuiteCreateDispose(
  description: string,
  factory: (dimensions: FimDimensions, imageHandle: string) => CoreCanvasWebGL
): void {
  describe(description, () => {

    it('Creates and disposes', () => {
      const canvas = factory(small, `${description} - Creates and disposes`);
      canvas.dispose();
    });

  });
}
