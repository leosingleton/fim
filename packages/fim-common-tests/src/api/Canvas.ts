// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { expectErrorAsync } from '../common/Async';
import { black, blue, bottomLeft, bottomRight, green, medium, midpoint, red, small, smallFourSquares, topLeft,
  topRight } from '../common/Globals';
import { TestImages } from '../common/TestImages';
import { using, usingAsync } from '@leosingleton/commonlibs';
import { Fim, FimDimensions, FimRect, FimError } from '@leosingleton/fim';

/** Fim test cases around canvas manipulation */
export function fimTestSuiteCanvas(
  description: string,
  factory: (maxImageDimensions: FimDimensions) => Fim
): void {
  describe(`Fim Canvas - ${description}`, () => {

    it('Supports fillSolid() and getPixel()', async () => {
      await usingAsync(factory(small), async fim => {
        const image = fim.createImage();
        image.fillSolid(red);
        expect(await image.getPixelAsync(midpoint(small))).toEqual(red);
      });
    });

    it('Supports loading pixels from array data', async () => {
      await usingAsync(factory(small), async fim => {
        const image = fim.createImage();
        const pixelData = TestImages.solidPixelData(small, green);
        await image.loadPixelDataAsync(pixelData);
        expect(await image.getPixelAsync(midpoint(small))).toEqual(green);
      });
    });

    it('Supports loading pixels from array data with rescale', async () => {
      await usingAsync(factory(small), async fim => {
        const image = fim.createImage();
        const pixelData = TestImages.solidPixelData(medium, blue);
        await image.loadPixelDataAsync(pixelData, medium);
        expect(await image.getPixelAsync(midpoint(small))).toEqual(blue);
      });
    });

    it('Supports loading pixels from array data (ImageBitmap disabled)', async () => {
      await usingAsync(factory(small), async fim => {
        fim.engineOptions.disableImageBitmap = true;
        const image = fim.createImage();
        const pixelData = TestImages.solidPixelData(small, green);
        await image.loadPixelDataAsync(pixelData);
        expect(await image.getPixelAsync(midpoint(small))).toEqual(green);
      });
    });

    it('Supports loading pixels from array data with rescale (ImageBitmap disabled)', async () => {
      await usingAsync(factory(small), async fim => {
        fim.engineOptions.disableImageBitmap = true;
        const image = fim.createImage();
        const pixelData = TestImages.solidPixelData(medium, blue);
        await image.loadPixelDataAsync(pixelData, medium);
        expect(await image.getPixelAsync(midpoint(small))).toEqual(blue);
      });
    });

    it('Copies from one image to another', async () => {
      await usingAsync(factory(small), async fim => {
        const image1 = fim.createImage();
        const pixelData = TestImages.solidPixelData(small, red);
        await image1.loadPixelDataAsync(pixelData);

        const image2 = fim.createImage();
        await image2.copyFromAsync(image1);
        expect(await image2.getPixelAsync(midpoint(small))).toEqual(red);
      });
    });

    it('Copies from a solid fill to an image', async () => {
      await usingAsync(factory(small), async fim => {
        const image1 = fim.createImage();
        image1.fillSolid(red);

        const image2 = fim.createImage();
        await image2.copyFromAsync(image1);
        expect(await image2.getPixelAsync(midpoint(small))).toEqual(red);
      });
    });

    it('Copies with crop and rescale', async () => {
      await usingAsync(factory(medium), async fim => {
        const png = TestImages.fourSquaresPng();
        const image1 = await fim.createImageFromPngAsync(png);
        const image2 = fim.createImage();

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

    it('copyFrom() doesn\'t allow an uninitialized source image', async () => {
      await usingAsync(factory(small), async fim => {
        const image1 = fim.createImage();
        const image2 = fim.createImage();
        (await expectErrorAsync(image1.copyFromAsync(image2))).toBeInstanceOf(FimError);
      });
    });

    it('copyFrom() doesn\'t allow copying itself', async () => {
      await usingAsync(factory(small), async fim => {
        const image = fim.createImage();
        image.fillSolid(red);
        (await expectErrorAsync(image.copyFromAsync(image))).toBeInstanceOf(FimError);
      });
    });

    it('copyFrom() doesn\'t allow copying from another FIM instance', async () => {
      await usingAsync(factory(small), async fim1 => {
        await usingAsync(factory(small), async fim2 => {
          const image1 = fim1.createImage();
          const image2 = fim2.createImage();
          image2.fillSolid(red);
          (await expectErrorAsync(image1.copyFromAsync(image2))).toBeInstanceOf(FimError);
        });
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
