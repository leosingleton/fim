// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { blue, green, medium, midpoint, red, small } from '../common/Globals';
import { TestImages } from '../common/TestImages';
import { using, usingAsync } from '@leosingleton/commonlibs';
import { Fim, FimDimensions } from '@leosingleton/fim';

/** Fim test cases around canvas manipulation */
export function fimTestSuiteCanvas(
  description: string,
  factory: (maxImageDimensions: FimDimensions) => Fim
): void {
  describe(`Fim Canvas - ${description}`, () => {

    it('Supports fillSolid() and getPixel()', () => {
      using(factory(small), fim => {
        const image = fim.createImage();
        image.fillSolid(red);
        expect(image.getPixel(midpoint(small))).toEqual(red);
      });
    });

    it('Supports loading pixels from array data', async () => {
      await usingAsync(factory(small), async fim => {
        const image = fim.createImage();
        const pixelData = TestImages.solidPixelData(small, green);
        await image.loadPixelDataAsync(pixelData);
        expect(image.getPixel(midpoint(small))).toEqual(green);
      });
    });

    it('Supports loading pixels from array data with rescale', async () => {
      await usingAsync(factory(small), async fim => {
        const image = fim.createImage();
        const pixelData = TestImages.solidPixelData(medium, blue);
        await image.loadPixelDataAsync(pixelData, medium);
        expect(image.getPixel(midpoint(small))).toEqual(blue);
      });
    });

    it('Supports loading pixels from array data (ImageBitmap disabled)', async () => {
      await usingAsync(factory(small), async fim => {
        fim.engineOptions.disableImageBitmap = true;
        const image = fim.createImage();
        const pixelData = TestImages.solidPixelData(small, green);
        await image.loadPixelDataAsync(pixelData);
        expect(image.getPixel(midpoint(small))).toEqual(green);
      });
    });

    it('Supports loading pixels from array data with rescale (ImageBitmap disabled)', async () => {
      await usingAsync(factory(small), async fim => {
        fim.engineOptions.disableImageBitmap = true;
        const image = fim.createImage();
        const pixelData = TestImages.solidPixelData(medium, blue);
        await image.loadPixelDataAsync(pixelData, medium);
        expect(image.getPixel(midpoint(small))).toEqual(blue);
      });
    });

    it('Supports debug mode, including tracing and warnings', () => {
      using(factory(small), fim => {
        fim.engineOptions.debugMode = true;
        fim.engineOptions.showTracing = true;
        fim.engineOptions.showWarnings = true;

        const image = fim.createImage();
        image.fillSolid(red);

        image.releaseAllResources();
        fim.releaseAllResources();
      });
    });

  });
}
