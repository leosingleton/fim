// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimNodeFactory } from '../factory/FimNodeFactory';
import { usingAsync } from '@leosingleton/commonlibs';
import { TestImages, TestSizes } from '@leosingleton/fim-common-tests';
import { resolve } from 'path';

const samplePng = resolve(__dirname, 'sample-images/four-squares.png');
const sampleJpeg = resolve(__dirname, 'sample-images/four-squares.jpg');

describe('Loads from PNG and JPEG files', () => {

  it('createImageFromPngFileAsync()', async () => {
    await usingAsync(FimNodeFactory.create(TestSizes.smallSquare), async fim => {
      // Load the four squares test pattern by URL
      const image = await fim.createImageFromPngFileAsync(samplePng);

      // Validate the test pattern
      await TestImages.expectFourSquaresPngAsync(image);
    });
  });

  it('createImageFromJpegFileAsync()', async () => {
    await usingAsync(FimNodeFactory.create(TestSizes.smallSquare), async fim => {
      // Load the four squares test pattern by URL
      const image = await fim.createImageFromJpegFileAsync(sampleJpeg);

      // Validate the test pattern
      await TestImages.expectFourSquaresJpegAsync(image);
    });
  });

  it('loadFromPngFileAsync()', async () => {
    await usingAsync(FimNodeFactory.create(TestSizes.smallSquare), async fim => {
      // Load the four squares test pattern by URL
      const image = fim.createImage();
      await image.loadFromPngFileAsync(samplePng);

      // Validate the test pattern
      await TestImages.expectFourSquaresPngAsync(image);
    });
  });

  it('loadFromJpegFileAsync()', async () => {
    await usingAsync(FimNodeFactory.create(TestSizes.smallSquare), async fim => {
      // Load the four squares test pattern by URL
      const image = fim.createImage();
      await image.loadFromJpegFileAsync(sampleJpeg);

      // Validate the test pattern
      await TestImages.expectFourSquaresJpegAsync(image);
    });
  });

});
