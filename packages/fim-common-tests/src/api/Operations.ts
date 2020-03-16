// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { black, green, grey, magenta, midpoint, small, white, yellow } from '../common/Globals';
import { usingAsync } from '@leosingleton/commonlibs';
import { Fim, FimDimensions, FimOpAlphaBlend, FimOpDarker } from '@leosingleton/fim';

/** Built-in operation tests for Fim */
export function fimTestSuiteOperations(
  description: string,
  factory: (maxImageDimensions: FimDimensions) => Fim
): void {
  describe(`Fim built-in operations - ${description}`, () => {

    it('AlphaBlend', async () => {
      await usingAsync(factory(small), async fim => {
        const blackImage = fim.createImage();
        await blackImage.fillSolidAsync(black);

        const whiteImage = fim.createImage();
        await whiteImage.fillSolidAsync(white);

        const op = new FimOpAlphaBlend(fim);
        op.setInputs(blackImage, whiteImage, 0.5);

        const outputImage = fim.createImage();
        await outputImage.executeAsync(op);
        expect((await outputImage.getPixelAsync(midpoint(small))).distance(grey)).toBeLessThan(0.05);
      });
    });

    it('Darker', async () => {
      await usingAsync(factory(small), async fim => {
        const yellowImage = fim.createImage();
        await yellowImage.fillSolidAsync(yellow);

        const magentaImage = fim.createImage();
        await magentaImage.fillSolidAsync(magenta);

        const op = new FimOpDarker(fim);
        op.setInputs(yellowImage, magentaImage);

        const outputImage = fim.createImage();
        await outputImage.executeAsync(op);
        expect(await outputImage.getPixelAsync(midpoint(small))).toEqual(green);
      });
    });

  });
}
