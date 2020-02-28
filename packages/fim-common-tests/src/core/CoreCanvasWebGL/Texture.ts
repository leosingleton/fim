// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { small } from '../../common/Globals';
import { using } from '@leosingleton/commonlibs';
import { FimDimensions } from '@leosingleton/fim';
import { CoreCanvasWebGL, defaultImageOptions, mergeImageOptions } from '@leosingleton/fim/build/internal';

/** CoreCanvasWebGL test cases for textures */
export function coreCanvasWebGLTestSuiteTexture(
  description: string,
  factory: (dimensions: FimDimensions) => CoreCanvasWebGL
): void {
  describe(`CoreCanvasWebGL Texture - ${description}`, () => {

    it('Creates and disposes', () => {
      using(factory(small), canvas => {
        const texture1 = canvas.createCoreTexture(small, defaultImageOptions);
        texture1.dispose();

        const texture2 = canvas.createCoreTexture(small, defaultImageOptions);
        texture2.dispose();
      });
    });

    it('Creates readonly', () => {
      using(factory(small), canvas => {
        const options = mergeImageOptions(defaultImageOptions, {
          glReadOnly: true
        });
        const texture = canvas.createCoreTexture(small, options);
        texture.dispose();
      });
    });

  });
}
