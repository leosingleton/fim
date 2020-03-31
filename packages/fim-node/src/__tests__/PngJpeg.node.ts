// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimNodeFactory } from '../factory/FimNodeFactory';
import { usingAsync } from '@leosingleton/commonlibs';
import { TestImages, TestSizes } from '@leosingleton/fim-common-tests';
import { resolve } from 'path';

describe('Loads from PNG and JPEG files', () => {

  it('createImageFromPngFileAsync()', async () => {
    await usingAsync(FimNodeFactory.create(TestSizes.smallFourSquares), async fim => {
      // Load the four squares test pattern by URL
      const image = await fim.createImageFromPngFileAsync(resolve(__dirname, 'sample-images/four-squares.png'));

      // Validate the test pattern
      await TestImages.expectFourSquaresPngAsync(image);
    });
  });

  it('createImageFromJpegFileAsync()', async () => {
    await usingAsync(FimNodeFactory.create(TestSizes.smallFourSquares), async fim => {
      // Load the four squares test pattern by URL
      const image = await fim.createImageFromJpegFileAsync(resolve(__dirname, 'sample-images/four-squares.jpg'));

      // Validate the test pattern
      await TestImages.expectFourSquaresJpegAsync(image);
    });
  });

});
