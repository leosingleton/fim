// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { TestColors } from '../common/TestColors';
import { TestSizes } from '../common/TestSizes';
import { usingAsync } from '@leosingleton/commonlibs';
import { Fim, FimOpFill } from '@leosingleton/fim';
import { EngineInternals } from '../common/EngineInternals';

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
        const input = fim.createImage(TestSizes.smallWide);
        await input.executeAsync(fill.$(TestColors.red));

        // The WebGL canvas should be 128x32
        expect(EngineInternals.getWebGLCanvas(fim).dim).toEqual(TestSizes.smallWide);
      });
    });

  });
}
