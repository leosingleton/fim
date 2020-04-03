// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { canvasOptions, textureOptions } from '../../common/CoreOptions';
import { midpoint } from '../../common/Globals';
import { TestColors } from '../../common/TestColors';
import { TestImages } from '../../common/TestImages';
import { TestSizes } from '../../common/TestSizes';
import { using, usingAsync } from '@leosingleton/commonlibs';
import { FimBitsPerPixel, FimDimensions, FimTextureSampling } from '@leosingleton/fim';
import { CoreCanvasOptions, CoreCanvasWebGL, CoreTexture } from '@leosingleton/fim/internals';

/** CoreCanvasWebGL test cases for textures */
export function coreCanvasWebGLTestSuiteTexture(
  description: string,
  factory: (canvasOptions: CoreCanvasOptions, dimensions: FimDimensions) => CoreCanvasWebGL
): void {
  describe(`CoreCanvasWebGL Texture - ${description}`, () => {

    it('Creates and disposes', () => {
      using(factory(canvasOptions, TestSizes.smallWide), canvas => {
        const texture1 = canvas.createCoreTexture(textureOptions);
        texture1.dispose();

        const texture2 = canvas.createCoreTexture(textureOptions);
        texture2.dispose();
      });
    });

    it('Disposes automatically', () => {
      let texture: CoreTexture;

      using(factory(canvasOptions, TestSizes.smallWide), canvas => {
        texture = canvas.createCoreTexture(textureOptions);
      });

      // Since the parent canvas was disposed, dispose() on the child object will throw an exception
      expect(() => texture.dispose()).toThrow();
    });

    it('Creates readonly', () => {
      using(factory(canvasOptions, TestSizes.smallWide), canvas => {
        const texture = canvas.createCoreTexture({
          bpp: FimBitsPerPixel.BPP8, // isReadOnly only supports 8 bits per pixel
          isReadOnly: true,
          sampling: FimTextureSampling.Nearest
        });
        texture.dispose();
      });
    });

    it('Fills with solid colors', () => {
      using(factory(canvasOptions, TestSizes.smallWide), canvas => {
        const texture = canvas.createCoreTexture(textureOptions);

        // Fill with red
        texture.fillSolid(TestColors.red);
        canvas.copyFrom(texture);
        expect(canvas.getPixel(midpoint(TestSizes.smallWide))).toEqual(TestColors.red);

        // Clear the WebGL canvas
        canvas.fillSolid(TestColors.black);
        expect(canvas.getPixel(midpoint(TestSizes.smallWide))).toEqual(TestColors.black);

        // Fill with blue
        texture.fillSolid(TestColors.blue);
        canvas.copyFrom(texture);
        expect(canvas.getPixel(midpoint(TestSizes.smallWide))).toEqual(TestColors.blue);
      });
    });

    it('Loads from pixel data', () => {
      using(factory(canvasOptions, TestSizes.smallWide), canvas => {
        // Load a texture with green
        const texture = canvas.createCoreTexture(textureOptions);
        texture.loadPixelData(TestImages.solidPixelData(TestSizes.smallWide, TestColors.green));

        // Ensure the texture is green
        canvas.copyFrom(texture);
        expect(canvas.getPixel(midpoint(TestSizes.smallWide))).toEqual(TestColors.green);
      });
    });

    it('Supports all combinations of channels, bits per pixel, and flags', async () => {
      await usingAsync(factory(canvasOptions, TestSizes.smallWide), async canvas => {
        const caps = canvas.detectCapabilities();

        // Create a 2D grey canvas
        const temp = canvas.createTemporaryCanvas2D(canvasOptions, TestSizes.mediumTall);
        temp.fillSolid(TestColors.grey);

        for (const bpp of [FimBitsPerPixel.BPP8, FimBitsPerPixel.BPP16, FimBitsPerPixel.BPP32]) {
          for (const isReadOnly of [false, true]) {
            for (const sampling of [FimTextureSampling.Linear, FimTextureSampling.Nearest]) {
              // Ensure the desired combination is valid
              if (sampling === FimTextureSampling.Linear && caps.glTextureDepthsLinear.indexOf(bpp) === -1) {
                continue;
              }
              if (sampling === FimTextureSampling.Nearest && caps.glTextureDepthsNearest.indexOf(bpp) === -1) {
                continue;
              }
              if (isReadOnly && bpp > FimBitsPerPixel.BPP8) {
                continue; // glReadOnly only supports 8 BPP
              }

              // Create a texture with the requested image options
              const texture = canvas.createCoreTexture({
                bpp,
                isReadOnly,
                sampling
              }, TestSizes.mediumTall);

              // Copy the 2D grey canvas to the texture
              await texture.copyFromAsync(temp);

              // Clear the WebGL canvas
              canvas.fillSolid(TestColors.black);
              expect(canvas.getPixel(midpoint(TestSizes.smallWide))).toEqual(TestColors.black);

              // Render the texture to the WebGL canvas
              canvas.copyFrom(texture);
              expect(canvas.getPixel(midpoint(TestSizes.smallWide))).toEqual(TestColors.grey);
            }
          }
        }
      });
    });

    it('Prevents creation of oversized textures', () => {
      using(factory(canvasOptions, TestSizes.smallWide), canvas => {
        const caps = canvas.detectCapabilities();
        const dim = FimDimensions.fromWidthHeight(caps.glMaxTextureSize + 1, 10);
        expect(() => canvas.createCoreTexture({
          bpp: FimBitsPerPixel.BPP8,
          isReadOnly: true,
          sampling: FimTextureSampling.Nearest
        }, dim)).toThrow();
      });
    });

    it('Prevents creation of oversized framebuffers', () => {
      using(factory(canvasOptions, TestSizes.smallWide), canvas => {
        const caps = canvas.detectCapabilities();
        const dim = FimDimensions.fromWidthHeight(caps.glMaxRenderBufferSize + 1, 10);
        expect(() => canvas.createCoreTexture(textureOptions, dim)).toThrow();
      });
    });

  });
}
