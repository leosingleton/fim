// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { midpoint, red, small } from '../../common/Globals';
import { using } from '@leosingleton/commonlibs';
import { FimDimensions } from '@leosingleton/fim';
import { CoreCanvasWebGL, CoreTexture, defaultImageOptions, mergeImageOptions } from '@leosingleton/fim/build/internal';

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

    it('Disposes automatically', () => {
      let texture: CoreTexture;

      using(factory(small), canvas => {
        texture = canvas.createCoreTexture(small, defaultImageOptions);
      });

      // Since the parent canvas was disposed, dispose() on the child object will throw an exception
      expect(() => texture.dispose()).toThrow();
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

    it('Fills with a solid color', () => {
      using(factory(small), canvas => {
        const texture = canvas.createCoreTexture(small, defaultImageOptions);

        // Fill the texture with the color red
        texture.fillSolid(red);

        // Render the texture to the WebGL canvas
        canvas.copyFrom(texture);

        // Ensure the output is red
        expect(canvas.getPixel(midpoint(small))).toEqual(red);
      });
    });

  });
}
