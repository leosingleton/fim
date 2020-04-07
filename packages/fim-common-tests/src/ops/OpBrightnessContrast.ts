// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { midpoint } from '../common/Globals';
import { TestColors } from '../common/TestColors';
import { TestSizes } from '../common/TestSizes';
import { usingAsync } from '@leosingleton/commonlibs';
import { Fim, FimOpBrightnessContrast } from '@leosingleton/fim';

/** FimOpBrightnessContrast unit tests */
export function fimTestSuiteOpBrightnessContrast(
  description: string,
  factory: () => Fim
): void {
  describe(`FimOpBrightnessContrast - ${description}`, () => {

    it('Increases Brightness', async () => {
      await usingAsync(factory(), async fim => {
        const brightnessContrast = new FimOpBrightnessContrast(fim);

        const input = fim.createImageWithFill(TestSizes.smallWide, TestColors.grey);

        const outputImage = fim.createImage(TestSizes.smallWide);
        await outputImage.executeAsync(brightnessContrast.$(input, 0.5, 0.0));

        expect(await outputImage.getPixelAsync(midpoint(TestSizes.smallWide))).toEqual(TestColors.white);
      });
    });

    it('Increases Contrast', async () => {
      await usingAsync(factory(), async fim => {
        const brightnessContrast = new FimOpBrightnessContrast(fim);

        const input = fim.createImageWithFill(TestSizes.smallWide, '#d33');

        const outputImage = fim.createImage(TestSizes.smallWide);
        await outputImage.executeAsync(brightnessContrast.$(input, 0.0, 0.5));

        expect(await outputImage.getPixelAsync(midpoint(TestSizes.smallWide))).toEqual(TestColors.red);
      });
    });

  });
}
