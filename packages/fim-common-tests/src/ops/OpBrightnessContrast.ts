// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { midpoint } from '../common/Globals';
import { TestColors } from '../common/TestColors';
import { TestSizes } from '../common/TestSizes';
import { usingAsync } from '@leosingleton/commonlibs';
import { Fim, FimDimensions, FimOpBrightnessContrast } from '@leosingleton/fim';

/** FimOpBrightnessContrast unit tests */
export function fimTestSuiteOpBrightnessContrast(
  description: string,
  factory: (maxImageDimensions: FimDimensions) => Fim
): void {
  describe(`FimOpBrightnessContrast - ${description}`, () => {

    it('Increases Brightness', async () => {
      await usingAsync(factory(TestSizes.small), async fim => {
        const input = fim.createImage();
        await input.fillSolidAsync(TestColors.grey);
        const op = new FimOpBrightnessContrast(fim);
        op.setInputs(input, 0.5, 0.0);

        const outputImage = fim.createImage();
        await outputImage.executeAsync(op);
        expect(await outputImage.getPixelAsync(midpoint(TestSizes.small))).toEqual(TestColors.white);
      });
    });

    it('Increases Contrast', async () => {
      await usingAsync(factory(TestSizes.small), async fim => {
        const input = fim.createImage();
        await input.fillSolidAsync('#d33');
        const op = new FimOpBrightnessContrast(fim);
        op.setInputs(input, 0.0, 0.5);

        const outputImage = fim.createImage();
        await outputImage.executeAsync(op);
        expect(await outputImage.getPixelAsync(midpoint(TestSizes.small))).toEqual(TestColors.red);
      });
    });

  });
}
