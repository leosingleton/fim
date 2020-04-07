// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { EngineInternals } from '../common/EngineInternals';
import { midpoint } from '../common/Globals';
import { TestColors } from '../common/TestColors';
import { TestSizes } from '../common/TestSizes';
import { usingAsync } from '@leosingleton/commonlibs';
import { Fim, FimOpFill } from '@leosingleton/fim';

/** FIM unit tests for the auto-scaling of the underlying WebGL canvas */
export function fimTestSuiteWebGLAutoscale(
  description: string,
  factory: () => Fim
): void {
  describe(`FIM WebGL Autoscale - ${description}`, () => {

    it('Sizes WebGL canvas to image size', async () => {
      await usingAsync(factory(), async fim => {
        const fill = new FimOpFill(fim);

        // Perform a WebGL operation on a 128x32 image
        const image = fim.createImage(TestSizes.smallWide);
        await image.executeAsync(fill.$(TestColors.red));

        // The WebGL canvas should be 128x32
        expect(EngineInternals.getWebGLCanvas(fim).dim).toEqual(TestSizes.smallWide);
      });
    });

    it('Resizes WebGL for larger images and preserves image contents', async () => {
      await usingAsync(factory(), async fim => {
        const fill = new FimOpFill(fim);

        // Perform a WebGL operation on a 128x32 image
        const image1 = fim.createImage(TestSizes.smallWide);
        await image1.executeAsync(fill.$(TestColors.red));

        // The WebGL canvas should be 128x32
        expect(EngineInternals.getWebGLCanvas(fim).dim).toEqual(TestSizes.smallWide);

        // Perform a WebGL operation on a 32x128 image
        const image2 = fim.createImage(TestSizes.smallTall);
        await image2.executeAsync(fill.$(TestColors.blue));

        // The WebGL canvas should now be 128x128
        expect(EngineInternals.getWebGLCanvas(fim).dim).toEqual(TestSizes.smallSquare);

        // Both images should have the correct color, as image1 was backed up to a 2D canvas during resizing
        expect(await image1.getPixelAsync(midpoint(TestSizes.smallWide))).toEqual(TestColors.red);
        expect(await image2.getPixelAsync(midpoint(TestSizes.smallTall))).toEqual(TestColors.blue);
      });
    });

  });
}
