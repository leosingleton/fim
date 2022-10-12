// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { bottomLeft, bottomRight, midpoint, topLeft, topRight } from '../common/Globals';
import { ImageInternals } from '../common/ImageInternals';
import { TestColors } from '../common/TestColors';
import { TestImages } from '../common/TestImages';
import { TestPatterns } from '../common/TestPatterns';
import { TestSizes } from '../common/TestSizes';
import { using, usingAsync } from '@leosingleton/commonlibs';
import { Fim, FimDimensions, FimOpInvert, FimOpUnsharpMask, FimRect } from '@leosingleton/fim';

/**
 * FIM test cases around transparent downscaling of oversized images
 *
 * Note that this is similar to, but separate from `fimTestSuiteDownscaled`, which covers images downscaled due to their
 * inputs being smaller than the desired dimensions. This suite is specifically for cases where downscale occurs because
 * the contents are larger than the parent FIM instance or the WebGL capabilities.
 */
export function fimTestSuiteOversized(
  description: string,
  factory: () => Fim
): void {
  describe(`FIM Oversized - ${description}`, () => {

    it('Downscales images larger than parent FIM', () => {
      using(factory(), fim => {
        fim.engineOptions.maxImageDimensions = TestSizes.smallWide;

        const image = fim.createImage(TestSizes.mediumTall);
        const eff = image.getEffectiveImageOptions();

        // Y-axis to get downscaled from 640 to 32 pixels
        expect(eff.downscale).toEqual(32 / 640);
        expect(eff.glDownscale).toEqual(32 / 640);
      });
    });

    it('Supports oversizedReadOnly image option', () => {
      using(factory(), fim => {
        // The oversizedReadOnly option has very limited use now that maxCanvasSize exists. It only works on platforms
        // that support larger texture than render buffer size on their GPU, but allow large enough canvases to load
        // the oversized texture--basically Chrome running on a limited Android device. This test case sets the flag,
        // but won't really make use of the flag since it's running on desktop/server hardware.
        const size = Math.min(fim.capabilities.glMaxTextureSize, fim.capabilities.maxCanvasSize);
        const dimensions = FimDimensions.fromSquareDimension(size);
        const image = fim.createImage(dimensions, { oversizedReadOnly: true });
        const eff = image.getEffectiveImageOptions();

        // No downscale occurs
        expect(eff.downscale).toEqual(1);
        expect(eff.glDownscale).toEqual(1);
      });
    });

    it('Supports custom downscale ratios', () => {
      using(factory(), fim => {
        const image = fim.createImage(TestSizes.mediumTall, {
          downscale: 0.5,
          glDownscale: 0.05
        });
        const eff = image.getEffectiveImageOptions();

        // Downscale matches image options as FIM and image have same dimensions
        expect(eff.downscale).toEqual(0.5);
        expect(eff.glDownscale).toEqual(0.05);
      });
    });

    it('Import and export pixel data accepts original dimensions', async () => {
      await usingAsync(factory(), async fim => {
        const image = fim.createImage(TestSizes.mediumTall);

        // renderAsync() uses the image's dimensions (medium)
        await TestPatterns.renderAsync(image, TestPatterns.horizontalGradient);

        // Exports at the image's dimensions (medium) despite being downscaled to the FIM size (small)
        const pixelData1 = await image.exportToPixelDataAsync();
        expect(pixelData1.length).toEqual(TestSizes.mediumTall.getArea() * 4);

        // Accepts srcCoords too
        const dim = FimRect.fromXYWidthHeight(10, 10, 140, 140);
        const pixelData2 = await image.exportToPixelDataAsync(dim);
        expect(pixelData2.length).toEqual(dim.getArea() * 4);
      });
    });

    it('Import and export PNG accepts original dimensions', async () => {
      await usingAsync(factory(), async fim => {
        fim.engineOptions.maxImageDimensions = TestSizes.smallWide;

        // 128x128 PNG is larger than the 128x32 small FIM instance
        const image = await fim.createImageFromPngAsync(TestImages.fourSquaresPng());

        // Y-axis to get downscaled from 128 to 32 pixels
        const eff = image.getEffectiveImageOptions();
        expect(eff.downscale).toEqual(32 / 128);

        // Four squares test pattern is present
        await TestImages.expectFourSquaresPngAsync(image);

        // Exports back to 128x128
        const png2 = await image.exportToPngAsync();
        const image2 = await fim.createImageFromPngAsync(png2);
        expect(image2.dim).toEqual(TestSizes.smallSquare);

        // Four squares test pattern is present
        await TestImages.expectFourSquaresPngAsync(image2);
      });
    });

    it('Import and export JPEG accepts original dimensions', async () => {
      await usingAsync(factory(), async fim => {
        fim.engineOptions.maxImageDimensions = TestSizes.smallWide;

        // 128x128 JPEG is larger than the 128x32 small FIM instance
        const image = await fim.createImageFromJpegAsync(TestImages.fourSquaresJpeg());

        // Y-axis to get downscaled from 128 to 32 pixels
        const eff = image.getEffectiveImageOptions();
        expect(eff.downscale).toEqual(32 / 128);

        // Four squares test pattern is present
        await TestImages.expectFourSquaresJpegAsync(image);

        // Exports back to 128x128
        const jpeg2 = await image.exportToJpegAsync();
        const image2 = await fim.createImageFromJpegAsync(jpeg2);
        expect(image2.dim).toEqual(TestSizes.smallSquare);

        // Four squares test pattern is present (note the distance tolerance is higher due to JPEG lossiness)
        await TestImages.expectFourSquaresJpegAsync(image, 0.004);
      });
    });

    it('Copies with crop and rescale', async () => {
      // This is copy-and-paste code from the unit test in Canvas.ts, except this time we run it with the parent FIM
      // instance set to small, so all images get transparently downscaled.
      await usingAsync(factory(), async fim => {
        const image1 = await fim.createImageFromPngAsync(TestImages.fourSquaresPng());
        const image2 = fim.createImage(TestSizes.mediumTall);

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

    it('Calculates correct ratios for CoreCanvas2D', async () => {
      await usingAsync(factory(), async fim => {
        fim.engineOptions.maxImageDimensions = TestSizes.smallWide;

        // Load a 128x128 PNG with a FIM instance of 128x32
        const image = await fim.createImageFromPngAsync(TestImages.fourSquaresPng());

        // The CoreCanvas2D backing image should have been downscaled to 32x32
        expect(ImageInternals.hasCanvas(image)).toBeTruthy();
        expect(ImageInternals.getCanvasDownscale(image)).toEqual(32 / 128);
        expect(ImageInternals.getCanvas(image).dim).toEqual(FimDimensions.fromSquareDimension(32));
      });
    });

    it('Calculates correct ratio for CoreTexture', async () => {
      await usingAsync(factory(), async fim => {
        fim.engineOptions.maxImageDimensions = TestSizes.smallWide;
        const invert = new FimOpInvert(fim);

        // Load a 128x128 PNG with a FIM instance of 128x32
        const image = await fim.createImageFromPngAsync(TestImages.fourSquaresPng());

        // Run an invert operation to use a CoreTexture
        await image.executeAsync(invert.$(image));

        // The CoreTexture backing image should have been downscaled to 32x32
        expect(ImageInternals.hasTexture(image)).toBeTruthy();
        expect(ImageInternals.getTextureDownscale(image)).toEqual(32 / 128);
        expect(ImageInternals.getTexture(image).dim).toEqual(FimDimensions.fromSquareDimension(32));
      });
    });

    it('Handles WebGL with downscale', async () => {
      await usingAsync(factory(), async fim => {
        // Create FIM resources
        const inputImage = await fim.createImageFromPngAsync(TestImages.fourSquaresPng(), { oversizedReadOnly: true });
        const outputImage = fim.createImage(TestSizes.smallSquare);
        const unsharpMask = new FimOpUnsharpMask(fim, true);

        // Run the WebGL operation
        await outputImage.executeAsync(unsharpMask.$(inputImage, 0.5, 2));

        // Export the result to pixel array
        const output = await outputImage.exportToPixelDataAsync();
        await TestImages.expectFourSquaresPngPixelDataAsync(output, outputImage.dim);
      });
    });

  });
}
