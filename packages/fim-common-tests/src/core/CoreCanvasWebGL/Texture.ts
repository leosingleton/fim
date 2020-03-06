// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { black, blue, grey, midpoint, red, small, medium } from '../../common/Globals';
import { using } from '@leosingleton/commonlibs';
import { FimBitsPerPixel, FimColorChannels, FimDimensions, FimTextureSampling } from '@leosingleton/fim';
import { CoreCanvasWebGL, CoreTexture } from '@leosingleton/fim/internals';

/** CoreCanvasWebGL test cases for textures */
export function coreCanvasWebGLTestSuiteTexture(
  description: string,
  factory: (dimensions: FimDimensions) => CoreCanvasWebGL
): void {
  describe(`CoreCanvasWebGL Texture - ${description}`, () => {

    it('Creates and disposes', () => {
      using(factory(small), canvas => {
        const texture1 = canvas.createCoreTexture();
        texture1.dispose();

        const texture2 = canvas.createCoreTexture();
        texture2.dispose();
      });
    });

    it('Disposes automatically', () => {
      let texture: CoreTexture;

      using(factory(small), canvas => {
        texture = canvas.createCoreTexture();
      });

      // Since the parent canvas was disposed, dispose() on the child object will throw an exception
      expect(() => texture.dispose()).toThrow();
    });

    it('Creates readonly', () => {
      using(factory(small), canvas => {
        const texture = canvas.createCoreTexture(undefined, {
          glReadOnly: true,
          bpp: FimBitsPerPixel.BPP8 // glReadOnly only supports 8 bits per pixel
        });
        texture.dispose();
      });
    });

    it('Fills with solid colors', () => {
      using(factory(small), canvas => {
        const texture = canvas.createCoreTexture();

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

    it('Supports all combinations of channels, bits per pixel, and flags', () => {
      using(factory(small), canvas => {
        const caps = canvas.detectCapabilities();

        // Create a 2D grey canvas
        const temp = canvas.createTemporaryCanvas2D();
        temp.fillSolid(grey);

        for (const allowOversized of [false, true]) {
          for (const bpp of [FimBitsPerPixel.BPP8, FimBitsPerPixel.BPP16, FimBitsPerPixel.BPP32]) {
            for (const channels of [FimColorChannels.Greyscale, /*FimColorChannels.RGB,*/ FimColorChannels.RGBA]) {
              for (const downscale of [0.5, 0.8, 1.0]) {
                for (const glDownscale of [0.25, 0.5, 1.0]) {
                  for (const glReadOnly of [false, true]) {
                    for (const sampling of [FimTextureSampling.Linear, FimTextureSampling.Nearest]) {
                      // Ensure the desired combination is valid
                      if (sampling === FimTextureSampling.Linear && bpp > caps.glMaxTextureDepthLinear) {
                        continue;
                      }
                      if (sampling === FimTextureSampling.Nearest && bpp > caps.glMaxTextureDepthNearest) {
                        continue;
                      }
                      if (glReadOnly && bpp > FimBitsPerPixel.BPP8) {
                        continue; // glReadOnly only supports 8 BPP
                      }
                      if (!glReadOnly && channels === FimColorChannels.Greyscale) {
                        continue; // FIM does not support rendering to a greyscale texture
                      }

                      // Create a texture with the requested image options
                      const texture = canvas.createCoreTexture(medium, {
                        allowOversized,
                        bpp,
                        channels,
                        downscale,
                        glDownscale,
                        glReadOnly,
                        sampling
                      });

                      // Copy the 2D grey canvas to the texture
                      texture.copyFrom(temp);

                      // Clear the WebGL canvas
                      canvas.fillSolid(black);
                      expect(canvas.getPixel(midpoint(small))).toEqual(black);

                      // Render the texture to the WebGL canvas
                      canvas.copyFrom(texture);
                      // BUGBUG: Copy texture to canvas doesn't work right now
                      //expect(canvas.getPixel(midpoint(small))).toEqual(grey);
                    }
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
