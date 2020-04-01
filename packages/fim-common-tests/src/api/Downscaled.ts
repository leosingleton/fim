// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { bottomLeft, bottomRight, topLeft, topRight } from '../common/Globals';
import { ImageInternals } from '../common/ImageInternals';
import { TestColors } from '../common/TestColors';
import { TestImages } from '../common/TestImages';
import { TestSizes } from '../common/TestSizes';
import { usingAsync } from '@leosingleton/commonlibs';
import { Fim, FimDimensions, FimOpInvert, FimRect } from '@leosingleton/fim';

/**
 * FIM test cases around handling downscaled images
 *
 * Note that this is similar to, but separate from `fimTestSuiteOversized`, which covers cases where downscale occurs
 * because the contents are larger than the parent FIM instance or the WebGL capabilities. This suite is specifically
 * for images downscaled due to their inputs being smaller than the desired dimensions.
 */
export function fimTestSuiteDownscaled(
  description: string,
  factory: (maxImageDimensions: FimDimensions) => Fim
): void {
  describe(`FIM Downscaled - ${description}`, () => {

    xit('Preserves input dimensions when copying', async () => {
      await usingAsync(factory(TestSizes.medium), async fim => {
        // Create a small image
        const smallImage = fim.createImage({}, TestSizes.small);
        await smallImage.fillSolidAsync(TestColors.red);

        // Copy the small image to a medium image
        const mediumImage = fim.createImage();
        await mediumImage.copyFromAsync(smallImage);

        // The memory backing the medium image should actually be the same size as the small one
        expect(ImageInternals.hasCanvas(mediumImage)).toBeTruthy();
        expect(ImageInternals.getCanvas(mediumImage).dim).toEqual(TestSizes.small);

        // Ensure the test pattern is as expected
        await TestImages.expectFourSquaresPngAsync(mediumImage);
      });
    });

    xit('Preserves input dimensions when copying with srcCoords', async () => {
      await usingAsync(factory(TestSizes.medium), async fim => {
        // Create a small test image
        const smallImage = await fim.createImageFromPngAsync(TestImages.fourSquaresPng());

        // Copy the top-right corner of the small image to a medium image
        const mediumImage = fim.createImage();
        const srcCoords = FimRect.fromXYWidthHeight(64, 0, 64, 64);
        await mediumImage.copyFromAsync(smallImage, srcCoords);

        // The memory backing the medium image should actually be the same size as srcCoords
        expect(ImageInternals.hasCanvas(mediumImage)).toBeTruthy();
        expect(ImageInternals.getCanvas(mediumImage).dim).toEqual(srcCoords.dim);

        // Ensure only the top-right corner of the test pattern (green) was copied
        expect(await mediumImage.getPixelAsync(topLeft(mediumImage.dim))).toEqual(TestColors.green);
        expect(await mediumImage.getPixelAsync(topRight(mediumImage.dim))).toEqual(TestColors.green);
        expect(await mediumImage.getPixelAsync(bottomLeft(mediumImage.dim))).toEqual(TestColors.green);
        expect(await mediumImage.getPixelAsync(bottomRight(mediumImage.dim))).toEqual(TestColors.green);
      });
    });

    xit('Preserves dimensions when loading from a smaller image', async () => {
      await usingAsync(factory(TestSizes.medium), async fim => {
        // Create a medium 480x640 image
        const image = fim.createImage();

        // Load a 128x128 PNG onto the 480x640 image with "rescale"
        await image.loadFromPngAsync(TestImages.fourSquaresPng(), true);

        // The memory backing the medium image should actually be 128x128
        expect(ImageInternals.hasCanvas(image)).toBeTruthy();
        expect(ImageInternals.getCanvas(image).dim).toEqual(TestSizes.smallFourSquares);

        // Ensure the test pattern is as expected
        await TestImages.expectFourSquaresPngAsync(image);
      });
    });

    xit('Preserves dimensions when transfering to a WebGL texture and back', async () => {
      await usingAsync(factory(TestSizes.medium), async fim => {
        // Create a medium 480x640 image
        const image1 = fim.createImage();

        // Load a 128x128 PNG onto the 480x640 image with "rescale"
        await image1.loadFromPngAsync(TestImages.fourSquaresPng(), true);

        // The memory backing the input image should actually be 128x128
        expect(ImageInternals.hasCanvas(image1)).toBeTruthy();
        expect(ImageInternals.getCanvas(image1).dim).toEqual(TestSizes.smallFourSquares);

        // Perform an invert as a WebGL operation
        const image2 = fim.createImage();
        const invert = new FimOpInvert(fim);
        invert.setInput(image1);
        await image2.executeAsync(invert);

        // The input WebGL texture remained 128x128, but the output texture was the requested dimensions
        expect(ImageInternals.hasTexture(image1)).toBeTruthy();
        expect(ImageInternals.getTexture(image1).dim).toEqual(TestSizes.smallFourSquares);
        expect(ImageInternals.hasTexture(image2)).toBeTruthy();
        expect(ImageInternals.getTexture(image2).dim).toEqual(TestSizes.medium);

        // Backup the output texture to a canvas
        await image2.backupAsync();

        // The memory backing the output canvas should also be medium
        expect(ImageInternals.hasCanvas(image2)).toBeTruthy();
        expect(ImageInternals.getCanvas(image2).dim).toEqual(TestSizes.medium);

        // Run the WebGL invert again, this time from 2 -> 1
        invert.setInput(image2);
        await image1.executeAsync(invert);

        // Ensure the output texture is now medium
        expect(ImageInternals.hasTexture(image1)).toBeTruthy();
        expect(ImageInternals.getTexture(image1).dim).toEqual(TestSizes.medium);

        // Ensure the test pattern is as expected
        await TestImages.expectFourSquaresPngAsync(image1);

        // Reading the test pattern copied it to a canvas. Ensure that is now medium too.
        expect(ImageInternals.hasCanvas(image1)).toBeTruthy();
        expect(ImageInternals.getCanvas(image1).dim).toEqual(TestSizes.medium);
      });
    });

    xit('Upscales dimensions when copying and preserveDownscaledDimensions=false', async () => {
      await usingAsync(factory(TestSizes.medium), async fim => {
        // Disable the preserveDownscaledDimensions optimization
        fim.engineOptions.preserveDownscaledDimensions = false;

        // Create a small image
        const smallImage = fim.createImage({}, TestSizes.small);
        await smallImage.fillSolidAsync(TestColors.red);

        // Copy the small image to a medium image
        const mediumImage = fim.createImage();
        await mediumImage.copyFromAsync(smallImage);

        // The image contents should be upscaled to the destination dimensions
        expect(ImageInternals.hasCanvas(mediumImage)).toBeTruthy();
        expect(ImageInternals.getCanvas(mediumImage).dim).toEqual(TestSizes.medium);

        // Ensure the test pattern is as expected
        await TestImages.expectFourSquaresPngAsync(mediumImage);
      });
    });

    it('Upscales dimensions when loading from a smaller image and preserveDownscaledDimensions=false', async () => {
      await usingAsync(factory(TestSizes.medium), async fim => {
        // Disable the preserveDownscaledDimensions optimization
        fim.engineOptions.preserveDownscaledDimensions = false;

        // Create a medium 480x640 image
        const image = fim.createImage();

        // Load a 128x128 PNG onto the 480x640 image with "rescale"
        await image.loadFromPngAsync(TestImages.fourSquaresPng(), true);

        // The image contents should be upscaled to the destination dimensions
        expect(ImageInternals.hasCanvas(image)).toBeTruthy();
        expect(ImageInternals.getCanvas(image).dim).toEqual(TestSizes.medium);

        // Ensure the test pattern is as expected
        await TestImages.expectFourSquaresPngAsync(image);
      });
    });

    xit('Upscales dimensions when glDownscale < downscale and preserveDownscaledDimensions=false', async () => {
      await usingAsync(factory(TestSizes.medium), async fim => {
        // Disable the preserveDownscaledDimensions optimization
        fim.engineOptions.preserveDownscaledDimensions = false;

        // Create a small test image
        const inputImage = await fim.createImageFromPngAsync(TestImages.fourSquaresPng());

        // Create a small destination image with glDownscale = 0.5
        const outputImage = fim.createImage({ glDownscale: 0.5 }, TestSizes.small);

        // Populate the destination image with a WebGL shader
        const invert = new FimOpInvert(fim);
        invert.setInput(inputImage);
        await outputImage.executeAsync(invert);

        // The texture backing the output image should be downscaled by 0.5x
        expect(ImageInternals.hasTexture(outputImage)).toBeTruthy();
        expect(ImageInternals.getCanvasDownscale(outputImage)).toEqual(0.5);
        expect(ImageInternals.getTexture(outputImage).dim).toEqual(TestSizes.small.rescale(0.5));

        // Ensure the test pattern is as expected
        await TestImages.expectFourSquaresPngAsync(outputImage);

        // Reading the test pattern copied it to a canvas. However, the canvas has a downscale of 1.0.
        expect(ImageInternals.hasCanvas(outputImage)).toBeTruthy();
        expect(ImageInternals.getCanvasDownscale(outputImage)).toEqual(1.0);
        expect(ImageInternals.getCanvas(outputImage).dim).toEqual(TestSizes.small);
      });
    });

  });
}