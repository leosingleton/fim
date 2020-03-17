// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { black, green, grey, magenta, midpoint, red, small, white, yellow, medium } from '../common/Globals';
import { usingAsync } from '@leosingleton/commonlibs';
import { Fim, FimColor, FimDimensions, FimImageOptions, FimOpAlphaBlend, FimOpDarker, FimOpGaussianBlur, FimOpLighter,
  FimTextureSampling } from '@leosingleton/fim';

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

    it('Lighter', async () => {
      await usingAsync(factory(small), async fim => {
        const redImage = fim.createImage();
        await redImage.fillSolidAsync(red);

        const greenImage = fim.createImage();
        await greenImage.fillSolidAsync(green);

        const op = new FimOpLighter(fim);
        op.setInputs(redImage, greenImage);

        const outputImage = fim.createImage();
        await outputImage.executeAsync(op);
        expect(await outputImage.getPixelAsync(midpoint(small))).toEqual(yellow);
      });
    });

    it('Supports the same image as an input and output', async () => {
      await usingAsync(factory(small), async fim => {
        const redImage = fim.createImage();
        await redImage.fillSolidAsync(red);

        const greenImage = fim.createImage();
        await greenImage.fillSolidAsync(green);

        const op = new FimOpLighter(fim);
        op.setInputs(redImage, greenImage);

        await greenImage.executeAsync(op);
        expect(await greenImage.getPixelAsync(midpoint(small))).toEqual(yellow);
      });
    });

    it('GaussianBlur', async () => testGaussianBlur(factory, false));
    it('GaussianBlur (fast)', async () => testGaussianBlur(factory, true));

  });
}

async function testGaussianBlur(factory: (maxImageDimensions: FimDimensions) => Fim, fast: boolean): Promise<void> {
  await usingAsync(factory(medium), async fim => {
    // Create a solid blue image of a specific shade
    const blueShade = FimColor.fromString('#21f');
    const options: FimImageOptions = { sampling: fast ? FimTextureSampling.Linear : FimTextureSampling.Nearest};
    const blueImage = fim.createImage(medium, options);
    await blueImage.fillSolidAsync(blueShade);

    // Blur the image
    const output = fim.createImage();
    const blur = new FimOpGaussianBlur(fim, fast);
    blur.setInputs(blueImage, 5);
    await output.executeAsync(blur);

    // Ensure the output is still the same shade of blue--blurring shouldn't change the color
    expect(await output.getPixelAsync(midpoint(medium))).toEqual(blueShade);
  });
}
