// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { expectErrorAsync } from '../common/Async';
import { bottomLeft, bottomRight, midpoint, topLeft, topRight } from '../common/Globals';
import { TestColors } from '../common/TestColors';
import { TestImages } from '../common/TestImages';
import { TestSizes } from '../common/TestSizes';
import { usingAsync } from '@leosingleton/commonlibs';
import { Fim, FimDimensions, FimRect, FimError, FimOpGaussianBlur } from '@leosingleton/fim';

/** FIM test cases around canvas manipulation */
export function fimTestSuiteCanvas(
  description: string,
  factory: (maxImageDimensions: FimDimensions) => Fim
): void {
  describe(`FIM Canvas - ${description}`, () => {

    it('Supports fillSolid() and getPixel()', async () => {
      await usingAsync(factory(TestSizes.smallWide), async fim => {
        const image = fim.createImage();
        await image.fillSolidAsync(TestColors.red);
        expect(await image.getPixelAsync(midpoint(TestSizes.smallWide))).toEqual(TestColors.red);
      });
    });

    it('Supports loading pixels from array data', async () => {
      await usingAsync(factory(TestSizes.smallWide), async fim => {
        const image = fim.createImage();
        const pixelData = TestImages.solidPixelData(TestSizes.smallWide, TestColors.green);
        await image.loadPixelDataAsync(pixelData);
        expect(await image.getPixelAsync(midpoint(TestSizes.smallWide))).toEqual(TestColors.green);
      });
    });

    it('Supports loading pixels from array data with rescale', async () => {
      await usingAsync(factory(TestSizes.smallWide), async fim => {
        const image = fim.createImage();
        const pixelData = TestImages.solidPixelData(TestSizes.mediumTall, TestColors.blue);
        await image.loadPixelDataAsync(pixelData, TestSizes.mediumTall);
        expect(await image.getPixelAsync(midpoint(TestSizes.smallWide))).toEqual(TestColors.blue);
      });
    });

    it('Supports loading pixels from array data (ImageBitmap disabled)', async () => {
      await usingAsync(factory(TestSizes.smallWide), async fim => {
        fim.engineOptions.disableImageBitmap = true;
        const image = fim.createImage();
        const pixelData = TestImages.solidPixelData(TestSizes.smallWide, TestColors.green);
        await image.loadPixelDataAsync(pixelData);
        expect(await image.getPixelAsync(midpoint(TestSizes.smallWide))).toEqual(TestColors.green);
      });
    });

    it('Supports loading pixels from array data with rescale (ImageBitmap disabled)', async () => {
      await usingAsync(factory(TestSizes.smallWide), async fim => {
        fim.engineOptions.disableImageBitmap = true;
        const image = fim.createImage();
        const pixelData = TestImages.solidPixelData(TestSizes.mediumTall, TestColors.blue);
        await image.loadPixelDataAsync(pixelData, TestSizes.mediumTall);
        expect(await image.getPixelAsync(midpoint(TestSizes.smallWide))).toEqual(TestColors.blue);
      });
    });

    it('Copies from one image to another', async () => {
      await usingAsync(factory(TestSizes.smallWide), async fim => {
        const image1 = fim.createImage();
        const pixelData = TestImages.solidPixelData(TestSizes.smallWide, TestColors.red);
        await image1.loadPixelDataAsync(pixelData);

        const image2 = fim.createImage();
        await image2.copyFromAsync(image1);
        expect(await image2.getPixelAsync(midpoint(TestSizes.smallWide))).toEqual(TestColors.red);
      });
    });

    it('Copies from a solid fill to an image', async () => {
      await usingAsync(factory(TestSizes.smallWide), async fim => {
        const image1 = fim.createImage();
        await image1.fillSolidAsync(TestColors.red);

        const image2 = fim.createImage();
        await image2.copyFromAsync(image1);
        expect(await image2.getPixelAsync(midpoint(TestSizes.smallWide))).toEqual(TestColors.red);
      });
    });

    it('Copies with crop and rescale', async () => {
      await usingAsync(factory(TestSizes.mediumTall), async fim => {
        const png = TestImages.fourSquaresPng();
        const image1 = await fim.createImageFromPngAsync(png);
        const image2 = fim.createImage();

        // Scale image1 (128x128) to medium size (480x640)
        await image2.copyFromAsync(image1);
        await TestImages.expectFourSquaresPngAsync(image2);

        // Copy image1 (128x128) to the top-left corner without rescaling (128x128 destination)
        await image2.copyFromAsync(image1, undefined, FimRect.fromDimensions(TestSizes.smallSquare));
        await TestImages.expectFourSquaresPngAsync(image2, TestSizes.smallSquare);

        // The top-left corner (128x128) was overwritten by the previous copy. The rest of the 480x640 image should
        // remain however.
        expect(await image2.getPixelAsync(topRight(TestSizes.mediumTall))).toEqual(TestColors.green);
        expect(await image2.getPixelAsync(bottomLeft(TestSizes.mediumTall))).toEqual(TestColors.blue);
        expect(await image2.getPixelAsync(bottomRight(TestSizes.mediumTall))).toEqual(TestColors.black);

        // Copy part of the top-right corner (32x32) of image1 to the entire image2 (480x640)
        await image2.copyFromAsync(image1, FimRect.fromPoints(midpoint(TestSizes.smallSquare),
          topRight(TestSizes.smallSquare)));
        expect(await image2.getPixelAsync(topLeft(TestSizes.mediumTall))).toEqual(TestColors.green);
        expect(await image2.getPixelAsync(topRight(TestSizes.mediumTall))).toEqual(TestColors.green);
        expect(await image2.getPixelAsync(bottomLeft(TestSizes.mediumTall))).toEqual(TestColors.green);
        expect(await image2.getPixelAsync(bottomRight(TestSizes.mediumTall))).toEqual(TestColors.green);
      });
    });

    it('copyFrom() doesn\'t allow an uninitialized source image', async () => {
      await usingAsync(factory(TestSizes.smallWide), async fim => {
        const image1 = fim.createImage();
        const image2 = fim.createImage();
        (await expectErrorAsync(image1.copyFromAsync(image2))).toBeInstanceOf(FimError);
      });
    });

    it('copyFrom() doesn\'t allow copying itself', async () => {
      await usingAsync(factory(TestSizes.smallWide), async fim => {
        const image = fim.createImage();
        await image.fillSolidAsync(TestColors.red);
        (await expectErrorAsync(image.copyFromAsync(image))).toBeInstanceOf(FimError);
      });
    });

    it('copyFrom() doesn\'t allow copying from another FIM instance', async () => {
      await usingAsync(factory(TestSizes.smallWide), async fim1 => {
        await usingAsync(factory(TestSizes.smallWide), async fim2 => {
          const image1 = fim1.createImage();
          const image2 = fim2.createImage();
          await image2.fillSolidAsync(TestColors.red);
          (await expectErrorAsync(image1.copyFromAsync(image2))).toBeInstanceOf(FimError);
        });
      });
    });

    it('Exports to raw pixel data', async () => {
      await usingAsync(factory(TestSizes.smallWide), async fim => {
        // Create a solid red image
        const image = fim.createImage();
        await image.fillSolidAsync(TestColors.red);

        // Export to RGBA pixel data
        const pixelData = await image.exportToPixelDataAsync();
        expect(pixelData[0]).toEqual(255);  // R
        expect(pixelData[1]).toEqual(0);    // G
        expect(pixelData[2]).toEqual(0);    // B
        expect(pixelData[3]).toEqual(255);  // A
      });
    });

    it('Supports debug mode, including tracing and warnings', async () => {
      await usingAsync(factory(TestSizes.smallWide), async fim => {
        const blur = new FimOpGaussianBlur(fim);

        fim.engineOptions.debugMode = true;
        fim.engineOptions.showTracing = true;
        fim.engineOptions.showWarnings = true;

        // Create an image larger than the parent FIM instance to generate a warning
        const image = fim.createImage({}, TestSizes.mediumTall);
        await image.fillSolidAsync(TestColors.red);

        // Load a PNG image to generate some tracing
        const png = TestImages.fourSquaresPng();
        await image.loadFromPngAsync(png);

        // Run a WebGL operation to allocate WebGL traces, too
        await image.executeAsync(blur.$(image, 5));

        image.releaseAllResources();
        fim.releaseAllResources();
      });
    });

    it('Enforces memory limits', async () => {
      await usingAsync(factory(TestSizes.largeWide), async fim => {
        // 128 * 128 * 4 is just enough memory for the four squares test PNG
        fim.engineOptions.maxCanvasMemory = 128 * 128 * 4 + 10;

        // Load the four squares test pattern onto an image backed by a CoreCanvas2D
        const png = TestImages.fourSquaresPng();
        const smallImage = await fim.createImageFromPngAsync(png);
        await smallImage.loadFromPngAsync(png);

        // Allocate a large canvas and copy the test pattern to it. This will throw an OutOfMemory FimError as it
        // exceeds the limit set in engineOptions.
        const largeImage = fim.createImage();
        (await expectErrorAsync(largeImage.copyFromAsync(smallImage))).toBeInstanceOf(FimError);
      });
    });

  });
}
