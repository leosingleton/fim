// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { expectErrorAsync } from '../common/Async';
import { midpoint } from '../common/Globals';
import { TestSizes } from '../common/TestSizes';
import { usingAsync } from '@leosingleton/commonlibs';
import { Fim, FimColor, FimDimensions, FimError, FimOpGaussianBlur, FimTextureSampling } from '@leosingleton/fim';

/** FimOpGaussianBlur unit tests */
export function fimTestSuiteOpGaussianBlur(
  description: string,
  factory: (maxImageDimensions: FimDimensions) => Fim
): void {
  describe(`FimOpGaussianBlur - ${description}`, () => {

    it('Performs blur', async () => {
      await testGaussianBlur(factory, false, FimTextureSampling.Nearest, FimTextureSampling.Nearest, 5);
    });

    it('Performs blur fast', async () => {
      await testGaussianBlur(factory, true, FimTextureSampling.Linear, FimTextureSampling.Linear, 5);
    });

    it('Performs blur with a large kernel', async () => {
      await testGaussianBlur(factory, false, FimTextureSampling.Nearest, FimTextureSampling.Nearest, 5, 35);
    });

    it('Fast fails if input is non-linear', async () => {
      (await expectErrorAsync(testGaussianBlur(factory, true,
        FimTextureSampling.Nearest, FimTextureSampling.Linear, 5))).toBeInstanceOf(FimError);
    });

    it('Fast fails if output is non-linear', async () => {
      (await expectErrorAsync(testGaussianBlur(factory, true,
        FimTextureSampling.Linear, FimTextureSampling.Nearest, 5))).toBeInstanceOf(FimError);
    });

  });
}

async function testGaussianBlur(
  factory: (maxImageDimensions: FimDimensions) => Fim,
  fast: boolean,
  inputSampling: FimTextureSampling,
  outputSampling: FimTextureSampling,
  sigma: number,
  kernelSize?: number
): Promise<void> {
  await usingAsync(factory(TestSizes.medium), async fim => {
    // Create a solid blue image of a specific shade
    const blueShade = FimColor.fromString('#21f');
    const blueImage = fim.createImage({ sampling: inputSampling });
    await blueImage.fillSolidAsync(blueShade);

    // Blur the image
    const output = fim.createImage({ sampling: outputSampling });
    const blur = new FimOpGaussianBlur(fim, fast);
    blur.setInputs(blueImage, sigma, kernelSize);
    await output.executeAsync(blur);

    // Ensure the output is still the same shade of blue--blurring shouldn't change the color
    expect(await output.getPixelAsync(midpoint(TestSizes.medium))).toEqual(blueShade);
  });
}
