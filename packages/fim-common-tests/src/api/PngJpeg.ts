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
        const png = TestImages.fourSquaresPng();
        await image.loadFromPngAsync(png);

        await TestImages.expectFourSquaresPngAsync(image);
      });
    });

    it('Imports from JPEG', async () => {
      await usingAsync(factory(), async fim => {
        const image = fim.createImage(TestSizes.smallSquare);
        const jpeg = TestImages.fourSquaresJpeg();
        await image.loadFromJpegAsync(jpeg);

        await TestImages.expectFourSquaresJpegAsync(image);
      });
    });

    it('Imports from PNG with rescale', async () => {
      await usingAsync(factory(), async fim => {
        const image = fim.createImage(TestSizes.mediumTall);
        const png = TestImages.fourSquaresPng();
        await image.loadFromPngAsync(png, true);

        await TestImages.expectFourSquaresPngAsync(image);
      });
    });

    it('Imports from JPEG with rescale', async () => {
      await usingAsync(factory(), async fim => {
        const image = fim.createImage(TestSizes.mediumTall);
        const jpeg = TestImages.fourSquaresJpeg();
        await image.loadFromJpegAsync(jpeg, true);

        await TestImages.expectFourSquaresJpegAsync(image);
      });
    });

    it('Exports to PNG', async () => {
      await usingAsync(factory(), async fim => {
        const image = fim.createImage(TestSizes.smallWide);
        await image.fillSolidAsync(TestColors.red);
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
        const image = fim.createImage(TestSizes.smallWide);
        await image.fillSolidAsync(TestColors.red);
        const jpeg = await image.exportToJpegAsync();

        // JPEG magic number is FF D8 FF
        expect(jpeg[0]).toBe(0xff);
        expect(jpeg[1]).toBe(0xd8);
        expect(jpeg[2]).toBe(0xff);
      });
    });

    it('Creates from PNG', async () => {
      await usingAsync(factory(), async fim => {
        const png = TestImages.fourSquaresPng();
        const image = await fim.createImageFromPngAsync(png);

        expect(image.dim).toEqual(TestSizes.smallSquare);
        await TestImages.expectFourSquaresPngAsync(image);
      });
    });

    it('Creates from JPEG', async () => {
      await usingAsync(factory(), async fim => {
        const jpeg = TestImages.fourSquaresJpeg();
        const image = await fim.createImageFromJpegAsync(jpeg);

        expect(image.dim).toEqual(TestSizes.smallSquare);
        await TestImages.expectFourSquaresJpegAsync(image);
      });
    });

  });
}
