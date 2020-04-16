// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { midpoint } from '../common/Globals';
import { TestColors } from '../common/TestColors';
import { TestImages } from '../common/TestImages';
import { TestSizes } from '../common/TestSizes';
import { usingAsync } from '@leosingleton/commonlibs';
import { Fim, FimBitsPerPixel, FimOpCopy, FimTextureSampling } from '@leosingleton/fim';

/** WebGL tests for FIM with various image options */
export function fimTestSuiteWebGLOptions(
  description: string,
  factory: () => Fim
): void {
  describe(`FIM WebGL Image Options - ${description}`, () => {

    it('Supports all combinations of channels, bits per pixel, and flags', async () => {
      await usingAsync(factory(), async fim => {
        const caps = fim.capabilities;
        const opCopy = new FimOpCopy(fim);

        // Create an image with the four squares test pattern
        const testPattern = await fim.createImageFromPngAsync(TestImages.fourSquaresPng(),
          { bpp: FimBitsPerPixel.BPP8, glReadOnly: true });

        for (const autoBackup of [false, true]) {
          for (const bpp of [FimBitsPerPixel.BPP8, FimBitsPerPixel.BPP16, FimBitsPerPixel.BPP32]) {
            for (const sampling of [FimTextureSampling.Linear, FimTextureSampling.Nearest]) {
              // Ensure the desired combination is valid
              if (sampling === FimTextureSampling.Linear && caps.glTextureDepthsLinear.indexOf(bpp) === -1) {
                continue;
              }
              if (sampling === FimTextureSampling.Nearest && caps.glTextureDepthsNearest.indexOf(bpp) === -1) {
                continue;
              }

              // Create two images with the requested image options
              const options = { autoBackup, bpp, sampling };
              const image1 = fim.createImage(TestSizes.smallTall, options);
              const image2 = fim.createImage(TestSizes.smallTall, options);

              // Copy the test pattern using a WebGL copy shader and ensure it copied correctly
              await image1.executeAsync(opCopy.$(testPattern));
              await TestImages.expectFourSquaresPngAsync(image1);

              // Copy the test pattern to another image and ensure it copied correctly
              await image2.executeAsync(opCopy.$(image1));
              await TestImages.expectFourSquaresPngAsync(image2);

              // Fill an image with a solid color
              await image1.fillSolidAsync(TestColors.yellow);

              // Copy the solid color using a WebGL copy shader and ensure it copied correctly
              await image2.executeAsync(opCopy.$(image1));
              expect(await image2.getPixelAsync(midpoint(TestSizes.smallTall))).toEqual(TestColors.yellow);
            }
          }
        }
      });
    });

  });
}
