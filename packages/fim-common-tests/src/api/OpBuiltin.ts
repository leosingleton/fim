// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { black, blue, green, grey, magenta, midpoint, red, small, white, yellow } from '../common/Globals';
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
      await usingAsync(factory(small), async fim => {
        const redImage = fim.createImage();
        await redImage.fillSolidAsync(red);

        const greenImage = fim.createImage();
        await greenImage.fillSolidAsync(green);

        const op = new FimOpAdd(fim);
        op.setInputs(redImage, greenImage);

        const outputImage = fim.createImage();
        await outputImage.executeAsync(op);
        expect(await outputImage.getPixelAsync(midpoint(small))).toEqual(yellow);
      });
    });

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
        expect(await outputImage.getPixelAsync(midpoint(small))).toEqual(red);
      });
    });

    it('Invert', async () => {
      await usingAsync(factory(small), async fim => {
        const blueImage = fim.createImage();
        await blueImage.fillSolidAsync(blue);

        const op = new FimOpInvert(fim);
        op.setInput(blueImage);

        const outputImage = fim.createImage();
        await outputImage.executeAsync(op);
        expect(await outputImage.getPixelAsync(midpoint(small))).toEqual(yellow);
      });
    });

    it('UnsharpMask', async () => {
      await usingAsync(factory(small), async fim => {
        const redImage = fim.createImage();
        await redImage.fillSolidAsync(red);

        const op = new FimOpUnsharpMask(fim);
        op.setInputs(redImage, 0.25, 5);

        const outputImage = fim.createImage();
        await outputImage.executeAsync(op);
        expect(await outputImage.getPixelAsync(midpoint(small))).toEqual(red);
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

    it('Subtract', async () => {
      await usingAsync(factory(small), async fim => {
        const magentaImage = fim.createImage();
        await magentaImage.fillSolidAsync(magenta);

        const blueImage = fim.createImage();
        await blueImage.fillSolidAsync(blue);

        const op = new FimOpSubtract(fim);
        op.setInputs(magentaImage, blueImage);

        const outputImage = fim.createImage();
        await outputImage.executeAsync(op);
        expect(await outputImage.getPixelAsync(midpoint(small))).toEqual(red);
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

  });
}
