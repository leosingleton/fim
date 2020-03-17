// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { expectErrorAsync } from '../common/Async';
import { midpoint, medium } from '../common/Globals';
import { usingAsync } from '@leosingleton/commonlibs';
import { Fim, FimColor, FimDimensions, FimError, FimOpGaussianBlur, FimTextureSampling } from '@leosingleton/fim';

/** FimOpGaussianBlur unit tests */
export function fimTestSuiteOpGaussianBlur(
  description: string,
  factory: (maxImageDimensions: FimDimensions) => Fim
): void {
  describe(`FimOpGaussianBlur - ${description}`, () => {

    it('Performs blur', async () => {
      await testGaussianBlur(factory, false, FimTextureSampling.Nearest, FimTextureSampling.Nearest);
    });

    it('Performs blur fast', async () => {
      await testGaussianBlur(factory, true, FimTextureSampling.Linear, FimTextureSampling.Linear);
    });

    it('Fast fails if input is non-linear', async () => {
      await (await expectErrorAsync(testGaussianBlur(factory, true,
        FimTextureSampling.Nearest, FimTextureSampling.Linear))).toBeInstanceOf(FimError);
    });

    it('Fast fails if output is non-linear', async () => {
      await (await expectErrorAsync(testGaussianBlur(factory, true,
        FimTextureSampling.Linear, FimTextureSampling.Nearest))).toBeInstanceOf(FimError);
    });

  });
}

async function testGaussianBlur(
  factory: (maxImageDimensions: FimDimensions) => Fim,
  fast: boolean,
  inputSampling: FimTextureSampling,
  outputSampling: FimTextureSampling
): Promise<void> {
  await usingAsync(factory(medium), async fim => {
    // Create a solid blue image of a specific shade
    const blueShade = FimColor.fromString('#21f');
    const blueImage = fim.createImage(medium, { sampling: inputSampling });
    await blueImage.fillSolidAsync(blueShade);

    // Blur the image
    const output = fim.createImage(medium, { sampling: outputSampling });
    const blur = new FimOpGaussianBlur(fim, fast);
    blur.setInputs(blueImage, 5);
    await output.executeAsync(blur);

    // Ensure the output is still the same shade of blue--blurring shouldn't change the color
    expect(await output.getPixelAsync(midpoint(medium))).toEqual(blueShade);
  });
}
