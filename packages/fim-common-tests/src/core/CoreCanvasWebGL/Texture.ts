// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { black, blue, grey, midpoint, red, small, medium } from '../../common/Globals';
import { using } from '@leosingleton/commonlibs';
import { FimBitsPerPixel, FimColorChannels, FimDimensions } from '@leosingleton/fim';
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

    it('Fills with solid colors', () => {
      using(factory(small), canvas => {
        const texture = canvas.createCoreTexture(small, defaultImageOptions);

        // Fill with red
        texture.fillSolid(red);
        canvas.copyFrom(texture);
        expect(canvas.getPixel(midpoint(small))).toEqual(red);

        // Clear the WebGL canvas
        canvas.fillSolid(black);
        expect(canvas.getPixel(midpoint(small))).toEqual(black);

        // Fill with blue
        texture.fillSolid(blue);
        canvas.copyFrom(texture);
        expect(canvas.getPixel(midpoint(small))).toEqual(blue);
      });
    });

    xit('Supports all combinations of channels, bits per pixel, and flags', () => {
      using(factory(small), canvas => {
        // Create a 2D grey canvas
        const temp = canvas.createTemporaryCanvas2D();
        temp.fillSolid(grey);

        for (const allowOversized of [false, true]) {
          for (const bpp of [FimBitsPerPixel.BPP8, FimBitsPerPixel.BPP16, FimBitsPerPixel.BPP32]) {
            for (const channels of [FimColorChannels.Greyscale, FimColorChannels.RGB, FimColorChannels.RGBA]) {
              for (const downscale of [0.5, 0.8, 1.0]) {
                for (const glDownscale of [0.25, 0.5, 1.0]) {
                  for (const glReadOnly of [false, true]) {
                    // Create a texture with the requested image options
                    const texture = canvas.createCoreTexture(medium, {
                      allowOversized,
                      backup: false,
                      bpp,
                      channels,
                      downscale,
                      glDownscale,
                      glReadOnly
                    });

                    // Copy the 2D grey canvas to the texture
                    texture.copyFrom(temp);

                    // Clear the WebGL canvas
                    canvas.fillSolid(black);
                    expect(canvas.getPixel(midpoint(small))).toEqual(black);

                    // Render the texture to the WebGL canvas
                    canvas.copyFrom(texture);
                    expect(canvas.getPixel(midpoint(small))).toEqual(grey);
                  }
                }
              }
            }
          }
        }
      });
    });

  });
}
