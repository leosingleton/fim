// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { black, blue, bottomLeft, bottomRight, green, medium, midpoint, red, small, smallFourSquares, topLeft,
  topRight } from '../common/Globals';
import { TestImages } from '../common/TestImages';
import { using, usingAsync } from '@leosingleton/commonlibs';
import { Fim, FimDimensions, FimRect } from '@leosingleton/fim';

/** Fim test cases around canvas manipulation */
export function fimTestSuiteCanvas(
  description: string,
  factory: (maxImageDimensions: FimDimensions) => Fim
): void {
  describe(`Fim Canvas - ${description}`, () => {

    it('Supports fillSolid() and getPixel()', () => {
      using(factory(small), fim => {
        const image = fim.createImage();
        image.fillSolid(red);
        expect(image.getPixel(midpoint(small))).toEqual(red);
      });
    });

    it('Supports loading pixels from array data', async () => {
      await usingAsync(factory(small), async fim => {
        const image = fim.createImage();
        const pixelData = TestImages.solidPixelData(small, green);
        await image.loadPixelDataAsync(pixelData);
        expect(image.getPixel(midpoint(small))).toEqual(green);
      });
    });

    it('Supports loading pixels from array data with rescale', async () => {
      await usingAsync(factory(small), async fim => {
        const image = fim.createImage();
        const pixelData = TestImages.solidPixelData(medium, blue);
        await image.loadPixelDataAsync(pixelData, medium);
        expect(image.getPixel(midpoint(small))).toEqual(blue);
      });
    });

    it('Supports loading pixels from array data (ImageBitmap disabled)', async () => {
      await usingAsync(factory(small), async fim => {
        fim.engineOptions.disableImageBitmap = true;
        const image = fim.createImage();
        const pixelData = TestImages.solidPixelData(small, green);
        await image.loadPixelDataAsync(pixelData);
        expect(image.getPixel(midpoint(small))).toEqual(green);
      });
    });

    it('Supports loading pixels from array data with rescale (ImageBitmap disabled)', async () => {
      await usingAsync(factory(small), async fim => {
        fim.engineOptions.disableImageBitmap = true;
        const image = fim.createImage();
        const pixelData = TestImages.solidPixelData(medium, blue);
        await image.loadPixelDataAsync(pixelData, medium);
        expect(image.getPixel(midpoint(small))).toEqual(blue);
      });
    });

    it('Copies from one image to another', async () => {
      await usingAsync(factory(small), async fim => {
        const image1 = fim.createImage();
        const pixelData = TestImages.solidPixelData(small, red);
        await image1.loadPixelDataAsync(pixelData);

        const image2 = fim.createImage();
        image2.copyFrom(image1);
        expect(image2.getPixel(midpoint(small))).toEqual(red);
      });
    });

    it('Copies from a solid fill to an image', async () => {
      using(factory(small), fim => {
        const image1 = fim.createImage();
        image1.fillSolid(red);

        const image2 = fim.createImage();
        image2.copyFrom(image1);
        expect(image2.getPixel(midpoint(small))).toEqual(red);
      });
    });

    it('Copies with crop and rescale', async () => {
      await usingAsync(factory(medium), async fim => {
        const png = TestImages.fourSquaresPng();
        const image1 = await fim.createImageFromPngAsync(png);
        const image2 = fim.createImage();

        // Scale image1 (128x128) to medium size (480x640)
        image2.copyFrom(image1);
        expect(image2.getPixel(topLeft(medium))).toEqual(red);
        expect(image2.getPixel(topRight(medium))).toEqual(green);
        expect(image2.getPixel(bottomLeft(medium))).toEqual(blue);
        expect(image2.getPixel(bottomRight(medium))).toEqual(black);

        // Copy image1 (128x128) to the top-left corner without rescaling (128x128 destination)
        image2.copyFrom(image1, undefined, FimRect.fromDimensions(smallFourSquares));
        expect(image2.getPixel(topLeft())).toEqual(red);
        expect(image2.getPixel(topRight())).toEqual(green);
        expect(image2.getPixel(bottomLeft())).toEqual(blue);
        expect(image2.getPixel(bottomRight())).toEqual(black);

        // The top-left corner (128x128) was overwritten by the previous copy. The rest of the 480x640 image should
        // remain however.
        expect(image2.getPixel(topRight(medium))).toEqual(green);
        expect(image2.getPixel(bottomLeft(medium))).toEqual(blue);
        expect(image2.getPixel(bottomRight(medium))).toEqual(black);

        // Copy part of the top-right corner (32x32) of image1 to the entire image2 (480x640)
        image2.copyFrom(image1, FimRect.fromPoints(midpoint(smallFourSquares), topRight(smallFourSquares)));
        expect(image2.getPixel(topLeft(medium))).toEqual(green);
        expect(image2.getPixel(topRight(medium))).toEqual(green);
        expect(image2.getPixel(bottomLeft(medium))).toEqual(green);
        expect(image2.getPixel(bottomRight(medium))).toEqual(green);
      });
    });

    it('Supports debug mode, including tracing and warnings', () => {
      using(factory(small), fim => {
        fim.engineOptions.debugMode = true;
        fim.engineOptions.showTracing = true;
        fim.engineOptions.showWarnings = true;

        const image = fim.createImage();
        image.fillSolid(red);

        image.releaseAllResources();
        fim.releaseAllResources();
      });
    });

  });
}
