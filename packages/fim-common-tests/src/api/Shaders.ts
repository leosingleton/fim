// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { black, grey, midpoint, small, white } from '../common/Globals';
import { usingAsync } from '@leosingleton/commonlibs';
import { Fim, FimDimensions, FimShaderAlphaBlend } from '@leosingleton/fim';

/** WebGL built-in shader tests for Fim */
export function fimTestSuiteShaders(
  description: string,
  factory: (maxImageDimensions: FimDimensions) => Fim
): void {
  describe(`Fim built-in shaders - ${description}`, () => {

    it('AlphaBlend', async () => {
      await usingAsync(factory(small), async fim => {
        const blackImage = fim.createImage();
        await blackImage.fillSolidAsync(black);

        const whiteImage = fim.createImage();
        await whiteImage.fillSolidAsync(white);

        const shader = new FimShaderAlphaBlend(fim);
        shader.setInputs(blackImage, whiteImage, 0.5);

        const outputImage = fim.createImage();
        await outputImage.executeAsync(shader);
        expect((await outputImage.getPixelAsync(midpoint(small))).distance(grey)).toBeLessThan(0.05);
      });
    });

  });
}
