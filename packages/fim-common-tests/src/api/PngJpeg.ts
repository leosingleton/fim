// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { black, blue, bottomLeft, bottomRight, green, medium, red, small, smallFourSquares, topLeft,
  topRight } from '../common/Globals';
import { TestImages } from '../common/TestImages';
import { usingAsync } from '@leosingleton/commonlibs';
import { Fim, FimDimensions } from '@leosingleton/fim';

/** Fim test cases around PNG and JPEG encoding/decoding */
export function fimTestSuitePngJpeg(
  description: string,
  factory: (maxImageDimensions: FimDimensions) => Fim
): void {
  describe(`Fim PNG/JPEG - ${description}`, () => {

    it('Imports from PNG', async () => {
      await usingAsync(factory(smallFourSquares), async fim => {
        const image = fim.createImage();
        const png = TestImages.fourSquaresPng();
        await image.loadFromPngAsync(png);

        expect(image.getPixel(topLeft())).toEqual(red);
        expect(image.getPixel(topRight())).toEqual(green);
        expect(image.getPixel(bottomLeft())).toEqual(blue);
        expect(image.getPixel(bottomRight())).toEqual(black);
      });
    });

    it('Imports from JPEG', async () => {
      await usingAsync(factory(smallFourSquares), async fim => {
        const image = fim.createImage();
        const jpeg = TestImages.fourSquaresJpeg();
        await image.loadFromJpegAsync(jpeg);

        expect(image.getPixel(topLeft()).distance(red)).toBeLessThan(0.002);
        expect(image.getPixel(topRight()).distance(green)).toBeLessThan(0.002);
        expect(image.getPixel(bottomLeft()).distance(blue)).toBeLessThan(0.002);
        expect(image.getPixel(bottomRight()).distance(black)).toBeLessThan(0.002);
      });
    });

    it('Imports from PNG with rescale', async () => {
      await usingAsync(factory(medium), async fim => {
        const image = fim.createImage();
        const png = TestImages.fourSquaresPng();
        await image.loadFromPngAsync(png, true);

        expect(image.getPixel(topLeft(medium))).toEqual(red);
        expect(image.getPixel(topRight(medium))).toEqual(green);
        expect(image.getPixel(bottomLeft(medium))).toEqual(blue);
        expect(image.getPixel(bottomRight(medium))).toEqual(black);
      });
    });

    it('Imports from JPEG with rescale', async () => {
      await usingAsync(factory(medium), async fim => {
        const image = fim.createImage();
        const jpeg = TestImages.fourSquaresJpeg();
        await image.loadFromJpegAsync(jpeg, true);

        expect(image.getPixel(topLeft(medium)).distance(red)).toBeLessThan(0.002);
        expect(image.getPixel(topRight(medium)).distance(green)).toBeLessThan(0.002);
        expect(image.getPixel(bottomLeft(medium)).distance(blue)).toBeLessThan(0.002);
        expect(image.getPixel(bottomRight(medium)).distance(black)).toBeLessThan(0.002);
      });
    });

    it('Exports to PNG', async () => {
      await usingAsync(factory(small), async fim => {
        const image = fim.createImage();
        image.fillSolid(red);
        const png = await image.exportToPngAsync();

        // PNG magic number is 89 50 4E 47 (ASCII for .PNG)
        expect(png[0]).toBe(0x89);
        expect(png[1]).toBe(0x50);
        expect(png[2]).toBe(0x4e);
        expect(png[3]).toBe(0x47);
      });
    });

    it('Exports to JPEG', async () => {
      await usingAsync(factory(small), async fim => {
        const image = fim.createImage();
        image.fillSolid(red);
        const jpeg = await image.exportToJpegAsync();

        // JPEG magic number is FF D8 FF
        expect(jpeg[0]).toBe(0xff);
        expect(jpeg[1]).toBe(0xd8);
        expect(jpeg[2]).toBe(0xff);
      });
    });

    it('Creates from PNG', async () => {
      await usingAsync(factory(medium), async fim => {
        const png = TestImages.fourSquaresPng();
        const image = await fim.createImageFromPngAsync(png);

        expect(image.imageDimensions).toEqual(smallFourSquares);
        expect(image.getPixel(topLeft())).toEqual(red);
        expect(image.getPixel(topRight())).toEqual(green);
        expect(image.getPixel(bottomLeft())).toEqual(blue);
        expect(image.getPixel(bottomRight())).toEqual(black);
      });
    });

    it('Creates from JPEG', async () => {
      await usingAsync(factory(medium), async fim => {
        const jpeg = TestImages.fourSquaresJpeg();
        const image = await fim.createImageFromJpegAsync(jpeg);

        expect(image.imageDimensions).toEqual(smallFourSquares);
        expect(image.getPixel(topLeft()).distance(red)).toBeLessThan(0.002);
        expect(image.getPixel(topRight()).distance(green)).toBeLessThan(0.002);
        expect(image.getPixel(bottomLeft()).distance(blue)).toBeLessThan(0.002);
        expect(image.getPixel(bottomRight()).distance(black)).toBeLessThan(0.002);
      });
    });

  });
}
