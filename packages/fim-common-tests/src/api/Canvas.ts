// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { expectErrorAsync } from '../common/Async';
import { black, blue, bottomLeft, bottomRight, green, large, medium, midpoint, red, small, smallFourSquares, topLeft,
  topRight } from '../common/Globals';
import { TestImages } from '../common/TestImages';
import { usingAsync } from '@leosingleton/commonlibs';
import { Fim, FimDimensions, FimRect, FimError, FimOpGaussianBlur } from '@leosingleton/fim';

/** FIM test cases around canvas manipulation */
export function fimTestSuiteCanvas(
  description: string,
  factory: (maxImageDimensions: FimDimensions) => Fim
): void {
  describe(`FIM Canvas - ${description}`, () => {

    it('Supports fillSolid() and getPixel()', async () => {
      await usingAsync(factory(small), async fim => {
        const image = fim.createImage();
        await image.fillSolidAsync(red);
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
        await image1.fillSolidAsync(red);

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
        await TestImages.expectFourSquaresPngAsync(image2);

        // Copy image1 (128x128) to the top-left corner without rescaling (128x128 destination)
        await image2.copyFromAsync(image1, undefined, FimRect.fromDimensions(smallFourSquares));
        await TestImages.expectFourSquaresPngAsync(image2, smallFourSquares);

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
        await image.fillSolidAsync(red);
        (await expectErrorAsync(image.copyFromAsync(image))).toBeInstanceOf(FimError);
      });
    });

    it('copyFrom() doesn\'t allow copying from another FIM instance', async () => {
      await usingAsync(factory(small), async fim1 => {
        await usingAsync(factory(small), async fim2 => {
          const image1 = fim1.createImage();
          const image2 = fim2.createImage();
          await image2.fillSolidAsync(red);
          (await expectErrorAsync(image1.copyFromAsync(image2))).toBeInstanceOf(FimError);
        });
      });
    });

    it('Exports to raw pixel data', async () => {
      await usingAsync(factory(small), async fim => {
        // Create a solid red image
        const image = fim.createImage();
        await image.fillSolidAsync(red);

        // Export to RGBA pixel data
        const pixelData = await image.exportToPixelDataAsync();
        expect(pixelData[0]).toEqual(255);  // R
        expect(pixelData[1]).toEqual(0);    // G
        expect(pixelData[2]).toEqual(0);    // B
        expect(pixelData[3]).toEqual(255);  // A
      });
    });

    it('Supports debug mode, including tracing and warnings', async () => {
      await usingAsync(factory(small), async fim => {
        fim.engineOptions.debugMode = true;
        fim.engineOptions.showTracing = true;
        fim.engineOptions.showWarnings = true;

        // Create an image larger than the parent FIM instance to generate a warning
        const image = fim.createImage({}, medium);
        await image.fillSolidAsync(red);

        // Load a PNG image to generate some tracing
        const png = TestImages.fourSquaresPng();
        await image.loadFromPngAsync(png);

        // Run a WebGL operation to allocate WebGL traces, too
        const blur = new FimOpGaussianBlur(fim);
        blur.setInputs(image, 5);
        await image.executeAsync(blur);

        image.releaseAllResources();
        fim.releaseAllResources();
      });
    });

    it('Enforces memory limits', async () => {
      await usingAsync(factory(large), async fim => {
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
