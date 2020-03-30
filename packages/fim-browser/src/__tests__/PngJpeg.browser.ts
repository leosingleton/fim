// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimBrowserFactory } from '../factory/FimBrowserFactory';
import { usingAsync } from '@leosingleton/commonlibs';
import { black, blue, bottomLeft, bottomRight, green, red, smallFourSquares, topLeft,
  topRight } from '@leosingleton/fim-common-tests';

describe('Loads from PNG and JPEG URLs', () => {

  xit('createImageFromPngFileAsync()', async () => {
    await usingAsync(FimBrowserFactory.create(smallFourSquares), async fim => {
      // Load the four squares test pattern by URL
      const image = await fim.createImageFromPngFileAsync('https://leosingleton.com/sample-images/four-squares.png');

      // Validate the test pattern
      expect(await image.getPixelAsync(topLeft())).toEqual(red);
      expect(await image.getPixelAsync(topRight())).toEqual(green);
      expect(await image.getPixelAsync(bottomLeft())).toEqual(blue);
      expect(await image.getPixelAsync(bottomRight())).toEqual(black);
    });
  });

  xit('createImageFromJpegFileAsync()', async () => {
    await usingAsync(FimBrowserFactory.create(smallFourSquares), async fim => {
      // Load the four squares test pattern by URL
      const image = await fim.createImageFromJpegFileAsync('https://leosingleton.com/sample-images/four-squares.jpg');

      // Validate the test pattern
      expect((await image.getPixelAsync(topLeft())).distance(red)).toBeLessThan(0.002);
      expect((await image.getPixelAsync(topRight())).distance(green)).toBeLessThan(0.002);
      expect((await image.getPixelAsync(bottomLeft())).distance(blue)).toBeLessThan(0.002);
      expect((await image.getPixelAsync(bottomRight())).distance(black)).toBeLessThan(0.002);
    });
  });

});
