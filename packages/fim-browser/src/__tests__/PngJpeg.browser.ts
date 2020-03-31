// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimBrowserFactory } from '../factory/FimBrowserFactory';
import { usingAsync } from '@leosingleton/commonlibs';
import { TestImages, sampleImagesUrl, smallFourSquares } from '@leosingleton/fim-common-tests';

describe('Loads from PNG and JPEG URLs', () => {

  it('createImageFromPngFileAsync()', async () => {
    await usingAsync(FimBrowserFactory.create(smallFourSquares), async fim => {
      // Load the four squares test pattern by URL
      const image = await fim.createImageFromPngFileAsync(`${sampleImagesUrl}/four-squares.png`);

      // Validate the test pattern
      await TestImages.expectFourSquaresPngAsync(image);
    });
  });

  it('createImageFromJpegFileAsync()', async () => {
    await usingAsync(FimBrowserFactory.create(smallFourSquares), async fim => {
      // Load the four squares test pattern by URL
      const image = await fim.createImageFromJpegFileAsync(`${sampleImagesUrl}/four-squares.jpg`);

      // Validate the test pattern
      await TestImages.expectFourSquaresJpegAsync(image);
    });
  });

});
