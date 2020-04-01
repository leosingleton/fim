// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { midpoint } from '../common/Globals';
import { TestColors } from '../common/TestColors';
import { TestSizes } from '../common/TestSizes';
import { usingAsync } from '@leosingleton/commonlibs';
import { Fim, FimDimensions, FimOpAdd, FimOpAlphaBlend, FimOpDarker, FimOpInvert, FimOpLighter, FimOpSubtract,
  FimOpUnsharpMask } from '@leosingleton/fim';

/** Built-in operation tests for Fim */
export function fimTestSuiteOpBuiltin(
  description: string,
  factory: (maxImageDimensions: FimDimensions) => Fim
): void {
  describe(`Fim built-in operations - ${description}`, () => {

    it('Add', async () => {
      await usingAsync(factory(TestSizes.small), async fim => {
        const add = new FimOpAdd(fim);

        const redImage = fim.createImage();
        await redImage.fillSolidAsync(TestColors.red);

        const greenImage = fim.createImage();
        await greenImage.fillSolidAsync(TestColors.green);

        const outputImage = fim.createImage();
        await outputImage.executeAsync(add.$(redImage, greenImage));

        expect(await outputImage.getPixelAsync(midpoint(TestSizes.small))).toEqual(TestColors.yellow);
      });
    });

    it('AlphaBlend', async () => {
      await usingAsync(factory(TestSizes.small), async fim => {
        const alphaBlend = new FimOpAlphaBlend(fim);

        const blackImage = fim.createImage();
        await blackImage.fillSolidAsync(TestColors.black);

        const whiteImage = fim.createImage();
        await whiteImage.fillSolidAsync(TestColors.white);

        const outputImage = fim.createImage();
        await outputImage.executeAsync(alphaBlend.$(blackImage, whiteImage, 0.5));

        const pixel = await outputImage.getPixelAsync(midpoint(TestSizes.small));
        expect(pixel.distance(TestColors.grey)).toBeLessThan(0.05);
      });
    });

    it('Darker', async () => {
      await usingAsync(factory(TestSizes.small), async fim => {
        const darker = new FimOpDarker(fim);

        const yellowImage = fim.createImage();
        await yellowImage.fillSolidAsync(TestColors.yellow);

        const magentaImage = fim.createImage();
        await magentaImage.fillSolidAsync(TestColors.magenta);

        const outputImage = fim.createImage();
        await outputImage.executeAsync(darker.$(yellowImage, magentaImage));

        expect(await outputImage.getPixelAsync(midpoint(TestSizes.small))).toEqual(TestColors.red);
      });
    });

    it('Invert', async () => {
      await usingAsync(factory(TestSizes.small), async fim => {
        const invert = new FimOpInvert(fim);

        const blueImage = fim.createImage();
        await blueImage.fillSolidAsync(TestColors.blue);

        const outputImage = fim.createImage();
        await outputImage.executeAsync(invert.$(blueImage));

        expect(await outputImage.getPixelAsync(midpoint(TestSizes.small))).toEqual(TestColors.yellow);
      });
    });

    it('UnsharpMask', async () => {
      await usingAsync(factory(TestSizes.small), async fim => {
        const unsharpMask = new FimOpUnsharpMask(fim);

        const redImage = fim.createImage();
        await redImage.fillSolidAsync(TestColors.red);

        const outputImage = fim.createImage();
        await outputImage.executeAsync(unsharpMask.$(redImage, 0.25, 5));

        expect(await outputImage.getPixelAsync(midpoint(TestSizes.small))).toEqual(TestColors.red);
      });
    });

    it('Lighter', async () => {
      await usingAsync(factory(TestSizes.small), async fim => {
        const lighter = new FimOpLighter(fim);

        const redImage = fim.createImage();
        await redImage.fillSolidAsync(TestColors.red);

        const greenImage = fim.createImage();
        await greenImage.fillSolidAsync(TestColors.green);

        const outputImage = fim.createImage();
        await outputImage.executeAsync(lighter.$(redImage, greenImage));

        expect(await outputImage.getPixelAsync(midpoint(TestSizes.small))).toEqual(TestColors.yellow);
      });
    });

    it('Subtract', async () => {
      await usingAsync(factory(TestSizes.small), async fim => {
        const subtract = new FimOpSubtract(fim);

        const magentaImage = fim.createImage();
        await magentaImage.fillSolidAsync(TestColors.magenta);

        const blueImage = fim.createImage();
        await blueImage.fillSolidAsync(TestColors.blue);

        const outputImage = fim.createImage();
        await outputImage.executeAsync(subtract.$(magentaImage, blueImage));

        expect(await outputImage.getPixelAsync(midpoint(TestSizes.small))).toEqual(TestColors.red);
      });
    });

    it('Supports the same image as an input and output', async () => {
      await usingAsync(factory(TestSizes.small), async fim => {
        const lighter = new FimOpLighter(fim);

        const redImage = fim.createImage();
        await redImage.fillSolidAsync(TestColors.red);

        const greenImage = fim.createImage();
        await greenImage.fillSolidAsync(TestColors.green);

        await greenImage.executeAsync(lighter.$(redImage, greenImage));

        expect(await greenImage.getPixelAsync(midpoint(TestSizes.small))).toEqual(TestColors.yellow);
      });
    });

  });
}
