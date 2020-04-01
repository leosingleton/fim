// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimBrowserFactory } from '../factory/FimBrowserFactory';
import { usingAsync } from '@leosingleton/commonlibs';
import { TestImages, TestSizes, sampleImagesUrl } from '@leosingleton/fim-common-tests';

const samplePng = `${sampleImagesUrl}/four-squares.png`;
const sampleJpeg = `${sampleImagesUrl}/four-squares.jpg`;

describe('Loads from PNG and JPEG URLs', () => {

  it('createImageFromPngFileAsync()', async () => {
    await usingAsync(FimBrowserFactory.create(TestSizes.smallFourSquares), async fim => {
      // Load the four squares test pattern by URL
      const image = await fim.createImageFromPngFileAsync(samplePng);

      // Validate the test pattern
      await TestImages.expectFourSquaresPngAsync(image);
    });
  });

  it('createImageFromJpegFileAsync()', async () => {
    await usingAsync(FimBrowserFactory.create(TestSizes.smallFourSquares), async fim => {
      // Load the four squares test pattern by URL
      const image = await fim.createImageFromJpegFileAsync(sampleJpeg);

      // Validate the test pattern
      await TestImages.expectFourSquaresJpegAsync(image);
    });
  });

  it('loadFromPngFileAsync()', async () => {
    await usingAsync(FimBrowserFactory.create(TestSizes.smallFourSquares), async fim => {
      // Load the four squares test pattern by URL
      const image = fim.createImage();
      await image.loadFromPngFileAsync(samplePng);

      // Validate the test pattern
      await TestImages.expectFourSquaresPngAsync(image);
    });
  });

  it('loadFromJpegFileAsync()', async () => {
    await usingAsync(FimBrowserFactory.create(TestSizes.smallFourSquares), async fim => {
      // Load the four squares test pattern by URL
      const image = fim.createImage();
      await image.loadFromJpegFileAsync(sampleJpeg);

      // Validate the test pattern
      await TestImages.expectFourSquaresJpegAsync(image);
    });
  });

});
