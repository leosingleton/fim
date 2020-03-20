// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { black, blue, bottomLeft, bottomRight, green, medium, midpoint, red, small, smallFourSquares, topLeft,
  topRight } from '../common/Globals';
import { TestImages } from '../common/TestImages';
import { TestPatterns } from '../common/TestPatterns';
import { using, usingAsync } from '@leosingleton/commonlibs';
import { Fim, FimDimensions, FimRect } from '@leosingleton/fim';

/** Oversized for Fim */
export function fimTestSuiteOversized(
  description: string,
  factory: (maxImageDimensions: FimDimensions) => Fim
): void {
  describe(`Fim Oversized - ${description}`, () => {

    it('Downscales images larger than parent FIM', () => {
      using(factory(small), fim => {
        const image = fim.createImage({}, medium);
        const eff = image.getEffectiveImageOptions();

        // Y-axis to get downscaled from 640 to 50 pixels
        expect(eff.downscale).toEqual(50 / 640);
        expect(eff.glDownscale).toEqual(50 / 640);
      });
    });

    it('Supports allowOversized image option', () => {
      using(factory(small), fim => {
        const image = fim.createImage({ allowOversized: true }, medium);
        const eff = image.getEffectiveImageOptions();

        // No downscale occurs
        expect(eff.downscale).toEqual(1);
        expect(eff.glDownscale).toEqual(1);
      });
    });

    it('Supports custom downscale ratios', () => {
      using(factory(medium), fim => {
        const image = fim.createImage({
          downscale: 0.5,
          glDownscale: 0.05
        }, medium);
        const eff = image.getEffectiveImageOptions();

        // Downscale matches image options as FIM and image have same dimensions
        expect(eff.downscale).toEqual(0.5);
        expect(eff.glDownscale).toEqual(0.05);
      });
    });

    it('Import and export pixel data accepts original dimensions', async () => {
      await usingAsync(factory(small), async fim => {
        const image = fim.createImage({}, medium);

        // renderAsync() uses the image's dimensions (medium)
        await TestPatterns.renderAsync(image, TestPatterns.horizontalGradient);

        // Exports at the image's dimensions (medium) despite being downscaled to the FIM size (small)
        const pixelData1 = await image.exportToPixelDataAsync();
        expect(pixelData1.length).toEqual(medium.getArea() * 4);

        // Accepts srcCoords too
        const dim = FimRect.fromXYWidthHeight(10, 10, 240, 240);
        const pixelData2 = await image.exportToPixelDataAsync(dim);
        expect(pixelData2.length).toEqual(dim.getArea() * 4);
      });
    });

    it('Import and export PNG accepts original dimensions', async () => {
      await usingAsync(factory(small), async fim => {
        // 128x128 PNG is larger than the 100x50 small FIM instance
        const png = TestImages.fourSquaresPng();
        const image = await fim.createImageFromPngAsync(png);

        // Y-axis to get downscaled from 128 to 50 pixels
        const eff = image.getEffectiveImageOptions();
        expect(eff.downscale).toEqual(50 / 128);

        // Four squares test pattern is present
        expect(await image.getPixelAsync(topLeft())).toEqual(red);
        expect(await image.getPixelAsync(topRight())).toEqual(green);
        expect(await image.getPixelAsync(bottomLeft())).toEqual(blue);
        expect(await image.getPixelAsync(bottomRight())).toEqual(black);

        // Exports back to 128x128
        const png2 = await image.exportToPngAsync();
        const image2 = await fim.createImageFromPngAsync(png2);
        expect(image2.dim).toEqual(smallFourSquares);

        // Four squares test pattern is present
        expect(await image2.getPixelAsync(topLeft())).toEqual(red);
        expect(await image2.getPixelAsync(topRight())).toEqual(green);
        expect(await image2.getPixelAsync(bottomLeft())).toEqual(blue);
        expect(await image2.getPixelAsync(bottomRight())).toEqual(black);
      });
    });

    it('Import and export JPEG accepts original dimensions', async () => {
      await usingAsync(factory(small), async fim => {
        // 128x128 JPEG is larger than the 100x50 small FIM instance
        const jpeg = TestImages.fourSquaresJpeg();
        const image = await fim.createImageFromJpegAsync(jpeg);

        // Y-axis to get downscaled from 128 to 50 pixels
        const eff = image.getEffectiveImageOptions();
        expect(eff.downscale).toEqual(50 / 128);

        // Four squares test pattern is present
        expect((await image.getPixelAsync(topLeft())).distance(red)).toBeLessThan(0.002);
        expect((await image.getPixelAsync(topRight())).distance(green)).toBeLessThan(0.002);
        expect((await image.getPixelAsync(bottomLeft())).distance(blue)).toBeLessThan(0.002);
        expect((await image.getPixelAsync(bottomRight())).distance(black)).toBeLessThan(0.002);

        // Exports back to 128x128
        const jpeg2 = await image.exportToJpegAsync();
        const image2 = await fim.createImageFromJpegAsync(jpeg2);
        expect(image2.dim).toEqual(smallFourSquares);

        // Four squares test pattern is present
        expect((await image2.getPixelAsync(topLeft())).distance(red)).toBeLessThan(0.002);
        expect((await image2.getPixelAsync(topRight())).distance(green)).toBeLessThan(0.002);
        expect((await image2.getPixelAsync(bottomLeft())).distance(blue)).toBeLessThan(0.002);
        expect((await image2.getPixelAsync(bottomRight())).distance(black)).toBeLessThan(0.002);
      });
    });

    it('Copies with crop and rescale', async () => {
      // This is copy-and-paste code from the unit test in Canvas.ts, except this time we run it with the parent FIM
      // instance set to small, so all images get transparently downscaled.
      await usingAsync(factory(small), async fim => {
        const png = TestImages.fourSquaresPng();
        const image1 = await fim.createImageFromPngAsync(png);
        const image2 = fim.createImage({}, medium);

        // Scale image1 (128x128) to medium size (480x640)
        await image2.copyFromAsync(image1);
        expect(await image2.getPixelAsync(topLeft(medium))).toEqual(red);
        expect(await image2.getPixelAsync(topRight(medium))).toEqual(green);
        expect(await image2.getPixelAsync(bottomLeft(medium))).toEqual(blue);
        expect(await image2.getPixelAsync(bottomRight(medium))).toEqual(black);

        // Copy image1 (128x128) to the top-left corner without rescaling (128x128 destination)
        await image2.copyFromAsync(image1, undefined, FimRect.fromDimensions(smallFourSquares));
        expect(await image2.getPixelAsync(topLeft())).toEqual(red);
        expect(await image2.getPixelAsync(topRight())).toEqual(green);
        expect(await image2.getPixelAsync(bottomLeft())).toEqual(blue);
        expect(await image2.getPixelAsync(bottomRight())).toEqual(black);

        // The top-left corner (128x128) was overwritten by the previous copy. The rest of the 480x640 image should
        // remain however.
        expect(await image2.getPixelAsync(topRight(medium))).toEqual(green);
        expect(await image2.getPixelAsync(bottomLeft(medium))).toEqual(blue);
        expect(await image2.getPixelAsync(bottomRight(medium))).toEqual(black);

        // Copy part of the top-right corner (32x32) of image1 to the entire image2 (480x640)
        await image2.copyFromAsync(image1, FimRect.fromPoints(midpoint(smallFourSquares), topRight(smallFourSquares)));
        expect(await image2.getPixelAsync(topLeft(medium))).toEqual(green);
        expect(await image2.getPixelAsync(topRight(medium))).toEqual(green);
        expect(await image2.getPixelAsync(bottomLeft(medium))).toEqual(green);
        expect(await image2.getPixelAsync(bottomRight(medium))).toEqual(green);
      });
    });

  });
}
