// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { TestColors } from '../common/TestColors';
import { TestImages } from '../common/TestImages';
import { TestSizes } from '../common/TestSizes';
import { usingAsync } from '@leosingleton/commonlibs';
import { Fim } from '@leosingleton/fim';

/** FIM test cases around PNG and JPEG encoding/decoding */
export function fimTestSuitePngJpeg(
  description: string,
  factory: () => Fim
): void {
  describe(`FIM PNG/JPEG - ${description}`, () => {

    it('Imports from PNG', async () => {
      await usingAsync(factory(), async fim => {
        const image = fim.createImage(TestSizes.smallSquare);
        await image.loadFromPngAsync(TestImages.fourSquaresPng());
        await TestImages.expectFourSquaresPngAsync(image);
      });
    });

    it('Imports from JPEG', async () => {
      await usingAsync(factory(), async fim => {
        const image = fim.createImage(TestSizes.smallSquare);
        await image.loadFromJpegAsync(TestImages.fourSquaresJpeg());
        await TestImages.expectFourSquaresJpegAsync(image);
      });
    });

    it('Imports from PNG with rescale', async () => {
      await usingAsync(factory(), async fim => {
        const image = fim.createImage(TestSizes.mediumTall);
        await image.loadFromPngAsync(TestImages.fourSquaresPng(), true);
        await TestImages.expectFourSquaresPngAsync(image);
      });
    });

    it('Imports from JPEG with rescale', async () => {
      await usingAsync(factory(), async fim => {
        const image = fim.createImage(TestSizes.mediumTall);
        await image.loadFromJpegAsync(TestImages.fourSquaresJpeg(), true);
        await TestImages.expectFourSquaresJpegAsync(image);
      });
    });

    it('Exports to PNG', async () => {
      await usingAsync(factory(), async fim => {
        const image = fim.createImageWithFill(TestSizes.smallWide, TestColors.red);
        const png = await image.exportToPngAsync();

        // PNG magic number is 89 50 4E 47 (ASCII for .PNG)
        expect(png[0]).toBe(0x89);
        expect(png[1]).toBe(0x50);
        expect(png[2]).toBe(0x4e);
        expect(png[3]).toBe(0x47);
      });
    });

    it('Exports to JPEG', async () => {
      await usingAsync(factory(), async fim => {
        const image = fim.createImageWithFill(TestSizes.smallWide, TestColors.red);
        const jpeg = await image.exportToJpegAsync();

        // JPEG magic number is FF D8 FF
        expect(jpeg[0]).toBe(0xff);
        expect(jpeg[1]).toBe(0xd8);
        expect(jpeg[2]).toBe(0xff);
      });
    });

    it('Creates from PNG', async () => {
      await usingAsync(factory(), async fim => {
        const image = await fim.createImageFromPngAsync(TestImages.fourSquaresPng());
        expect(image.dim).toEqual(TestSizes.smallSquare);
        await TestImages.expectFourSquaresPngAsync(image);
      });
    });

    it('Creates from JPEG', async () => {
      await usingAsync(factory(), async fim => {
        const image = await fim.createImageFromJpegAsync(TestImages.fourSquaresJpeg());
        expect(image.dim).toEqual(TestSizes.smallSquare);
        await TestImages.expectFourSquaresJpegAsync(image);
      });
    });

  });
}
