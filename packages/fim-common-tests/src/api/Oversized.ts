// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { bottomLeft, bottomRight, midpoint, topLeft, topRight } from '../common/Globals';
import { TestColors } from '../common/TestColors';
import { TestImages } from '../common/TestImages';
import { TestPatterns } from '../common/TestPatterns';
import { TestSizes } from '../common/TestSizes';
import { using, usingAsync } from '@leosingleton/commonlibs';
import { Fim, FimBitsPerPixel, FimDimensions, FimOpInvert, FimOpUnsharpMask, FimRect } from '@leosingleton/fim';

/** FIM test cases around transparent downscaling of oversized images */
export function fimTestSuiteOversized(
  description: string,
  factory: (maxImageDimensions: FimDimensions) => Fim
): void {
  describe(`FIM Oversized - ${description}`, () => {

    it('Downscales images larger than parent FIM', () => {
      using(factory(TestSizes.small), fim => {
        const image = fim.createImage({}, TestSizes.medium);
        const eff = image.getEffectiveImageOptions();

        // Y-axis to get downscaled from 640 to 50 pixels
        expect(eff.downscale).toEqual(50 / 640);
        expect(eff.glDownscale).toEqual(50 / 640);
      });
    });

    it('Supports allowOversized image option', () => {
      using(factory(TestSizes.small), fim => {
        const image = fim.createImage({ allowOversized: true }, TestSizes.medium);
        const eff = image.getEffectiveImageOptions();

        // No downscale occurs
        expect(eff.downscale).toEqual(1);
        expect(eff.glDownscale).toEqual(1);
      });
    });

    it('Supports custom downscale ratios', () => {
      using(factory(TestSizes.medium), fim => {
        const image = fim.createImage({
          downscale: 0.5,
          glDownscale: 0.05
        }, TestSizes.medium);
        const eff = image.getEffectiveImageOptions();

        // Downscale matches image options as FIM and image have same dimensions
        expect(eff.downscale).toEqual(0.5);
        expect(eff.glDownscale).toEqual(0.05);
      });
    });

    it('Import and export pixel data accepts original dimensions', async () => {
      await usingAsync(factory(TestSizes.small), async fim => {
        const image = fim.createImage({}, TestSizes.medium);

        // renderAsync() uses the image's dimensions (medium)
        await TestPatterns.renderAsync(image, TestPatterns.horizontalGradient);

        // Exports at the image's dimensions (medium) despite being downscaled to the FIM size (small)
        const pixelData1 = await image.exportToPixelDataAsync();
        expect(pixelData1.length).toEqual(TestSizes.medium.getArea() * 4);

        // Accepts srcCoords too
        const dim = FimRect.fromXYWidthHeight(10, 10, 240, 240);
        const pixelData2 = await image.exportToPixelDataAsync(dim);
        expect(pixelData2.length).toEqual(dim.getArea() * 4);
      });
    });

    it('Import and export PNG accepts original dimensions', async () => {
      await usingAsync(factory(TestSizes.small), async fim => {
        // 128x128 PNG is larger than the 100x50 small FIM instance
        const png = TestImages.fourSquaresPng();
        const image = await fim.createImageFromPngAsync(png);

        // Y-axis to get downscaled from 128 to 50 pixels
        const eff = image.getEffectiveImageOptions();
        expect(eff.downscale).toEqual(50 / 128);

        // Four squares test pattern is present
        await TestImages.expectFourSquaresPngAsync(image);

        // Exports back to 128x128
        const png2 = await image.exportToPngAsync();
        const image2 = await fim.createImageFromPngAsync(png2);
        expect(image2.dim).toEqual(TestSizes.smallFourSquares);

        // Four squares test pattern is present
        await TestImages.expectFourSquaresPngAsync(image2);
      });
    });

    it('Import and export JPEG accepts original dimensions', async () => {
      await usingAsync(factory(TestSizes.small), async fim => {
        // 128x128 JPEG is larger than the 100x50 small FIM instance
        const jpeg = TestImages.fourSquaresJpeg();
        const image = await fim.createImageFromJpegAsync(jpeg);

        // Y-axis to get downscaled from 128 to 50 pixels
        const eff = image.getEffectiveImageOptions();
        expect(eff.downscale).toEqual(50 / 128);

        // Four squares test pattern is present
        await TestImages.expectFourSquaresJpegAsync(image);

        // Exports back to 128x128
        const jpeg2 = await image.exportToJpegAsync();
        const image2 = await fim.createImageFromJpegAsync(jpeg2);
        expect(image2.dim).toEqual(TestSizes.smallFourSquares);

        // Four squares test pattern is present (note the distance tolerance is higher due to JPEG lossiness)
        await TestImages.expectFourSquaresJpegAsync(image, 0.004);
      });
    });

    it('Copies with crop and rescale', async () => {
      // This is copy-and-paste code from the unit test in Canvas.ts, except this time we run it with the parent FIM
      // instance set to small, so all images get transparently downscaled.
      await usingAsync(factory(TestSizes.small), async fim => {
        const png = TestImages.fourSquaresPng();
        const image1 = await fim.createImageFromPngAsync(png);
        const image2 = fim.createImage({}, TestSizes.medium);

        // Scale image1 (128x128) to medium size (480x640)
        await image2.copyFromAsync(image1);
        await TestImages.expectFourSquaresPngAsync(image2);

        // Copy image1 (128x128) to the top-left corner without rescaling (128x128 destination)
        await image2.copyFromAsync(image1, undefined, FimRect.fromDimensions(TestSizes.smallFourSquares));
        await TestImages.expectFourSquaresPngAsync(image2, TestSizes.smallFourSquares);

        // The top-left corner (128x128) was overwritten by the previous copy. The rest of the 480x640 image should
        // remain however.
        expect(await image2.getPixelAsync(topRight(TestSizes.medium))).toEqual(TestColors.green);
        expect(await image2.getPixelAsync(bottomLeft(TestSizes.medium))).toEqual(TestColors.blue);
        expect(await image2.getPixelAsync(bottomRight(TestSizes.medium))).toEqual(TestColors.black);

        // Copy part of the top-right corner (32x32) of image1 to the entire image2 (480x640)
        await image2.copyFromAsync(image1, FimRect.fromPoints(midpoint(TestSizes.smallFourSquares),
          topRight(TestSizes.smallFourSquares)));
        expect(await image2.getPixelAsync(topLeft(TestSizes.medium))).toEqual(TestColors.green);
        expect(await image2.getPixelAsync(topRight(TestSizes.medium))).toEqual(TestColors.green);
        expect(await image2.getPixelAsync(bottomLeft(TestSizes.medium))).toEqual(TestColors.green);
        expect(await image2.getPixelAsync(bottomRight(TestSizes.medium))).toEqual(TestColors.green);
      });
    });

    it('Calculates correct ratios for CoreCanvas2D', async () => {
      await usingAsync(factory(TestSizes.small), async fim => {
        // Load a 128x128 PNG with a FIM instance of 100x50
        const png = TestImages.fourSquaresPng();
        const image = await fim.createImageFromPngAsync(png);

        // The CoreCanvas2D backing image should have been downscaled to 50x50
        expect((image as any).contentCanvas.isCurrent).toBeTruthy();
        expect((image as any).contentCanvas.downscale).toEqual(50 / 128);
        expect((image as any).contentCanvas.imageContent.dim).toEqual(FimDimensions.fromSquareDimension(50));
      });
    });

    it('Calculates correct ratio for CoreTexture', async () => {
      await usingAsync(factory(TestSizes.small), async fim => {
        // Load a 128x128 PNG with a FIM instance of 100x50
        const png = TestImages.fourSquaresPng();
        const image = await fim.createImageFromPngAsync(png);

        // Run an invert operation to use a CoreTexture
        const opInvert = new FimOpInvert(fim);
        opInvert.setInput(image);
        await image.executeAsync(opInvert);

        // The CoreTexture backing image should have been downscaled to 50x50
        expect((image as any).contentTexture.isCurrent).toBeTruthy();
        expect((image as any).contentTexture.downscale).toEqual(50 / 128);
        expect((image as any).contentTexture.imageContent.dim).toEqual(FimDimensions.fromSquareDimension(50));
      });
    });

    it('Handles WebGL with downscale', async () => {
      await usingAsync(factory(TestSizes.small), async fim => {
        // Create FIM resources
        const png = TestImages.fourSquaresPng();
        const inputImage = await fim.createImageFromPngAsync(png, { bpp: FimBitsPerPixel.BPP8, glReadOnly: true });
        const outputImage = fim.createImage({}, TestSizes.smallFourSquares);
        const opUnsharpMask = new FimOpUnsharpMask(fim, true);

        // Run the WebGL operation
        opUnsharpMask.setInputs(inputImage, 0.5, 2);
        await outputImage.executeAsync(opUnsharpMask);

        // Export the result to pixel array
        const output = await outputImage.exportToPixelDataAsync();
        await TestImages.expectFourSquaresPngPixelDataAsync(output, outputImage.dim);
      });
    });

  });
}
