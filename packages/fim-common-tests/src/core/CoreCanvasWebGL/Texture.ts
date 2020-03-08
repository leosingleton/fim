// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { black, blue, green, grey, midpoint, red, small, medium } from '../../common/Globals';
import { TestImages } from '../../common/TestImages';
import { using, usingAsync } from '@leosingleton/commonlibs';
import { FimBitsPerPixel, FimDimensions, FimTextureSampling } from '@leosingleton/fim';
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

    it('Loads from pixel data', () => {
      using(factory(small), canvas => {
        // Load a texture with green
        const texture = canvas.createCoreTexture();
        texture.loadPixelData(TestImages.solidPixelData(small, green));

        // Ensure the texture is green
        canvas.copyFrom(texture);
        expect(canvas.getPixel(midpoint(small))).toEqual(green);
      });
    });

    it('Supports all combinations of channels, bits per pixel, and flags', async () => {
      await usingAsync(factory(small), async canvas => {
        const caps = canvas.detectCapabilities();

        // Create a 2D grey canvas
        const temp = canvas.createTemporaryCanvas2D(medium);
        temp.fillSolid(grey);

        for (const allowOversized of [false, true]) {
          for (const bpp of [FimBitsPerPixel.BPP8, FimBitsPerPixel.BPP16, FimBitsPerPixel.BPP32]) {
            for (const downscale of [0.5, 0.8, 1.0]) {
              for (const glDownscale of [0.25, 0.5, 1.0]) {
                for (const glReadOnly of [false, true]) {
                  for (const sampling of [FimTextureSampling.Linear, FimTextureSampling.Nearest]) {
                    // Ensure the desired combination is valid
                    if (sampling === FimTextureSampling.Linear && caps.glTextureDepthsLinear.indexOf(bpp) === -1) {
                      continue;
                    }
                    if (sampling === FimTextureSampling.Nearest && caps.glTextureDepthsNearest.indexOf(bpp) === -1) {
                      continue;
                    }
                    if (glReadOnly && bpp > FimBitsPerPixel.BPP8) {
                      continue; // glReadOnly only supports 8 BPP
                    }

                    // Create a texture with the requested image options
                    const texture = canvas.createCoreTexture(medium, {
                      allowOversized,
                      bpp,
                      downscale,
                      glDownscale,
                      glReadOnly,
                      sampling
                    });

                    // Copy the 2D grey canvas to the texture
                    await texture.copyFromAsync(temp);

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

    it('Prevents creation of oversized textures', () => {
      using(factory(small), canvas => {
        const caps = canvas.detectCapabilities();
        const dim = FimDimensions.fromWidthHeight(caps.glMaxTextureSize + 1, 10);
        expect(() => canvas.createCoreTexture(dim, { glReadOnly: true })).toThrow();
      });
    });

    it('Prevents creation of oversized framebuffers', () => {
      using(factory(small), canvas => {
        const caps = canvas.detectCapabilities();
        const dim = FimDimensions.fromWidthHeight(caps.glMaxRenderBufferSize + 1, 10);
        expect(() => canvas.createCoreTexture(dim)).toThrow();
      });
    });

  });
}
