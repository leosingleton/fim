// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { blue, green, medium, midpoint, red, small } from '../common/Globals';
import { TestImages } from '../common/TestImages';
import { Fim, FimDimensions } from '@leosingleton/fim';

/** Fim test cases around canvas manipulation */
export function fimTestSuiteCanvas(
  description: string,
  factory: (maxImageDimensions: FimDimensions) => Fim
): void {
  describe(description, () => {

    it('Supports fillSolid() and getPixel()', () => {
      const client = factory(small);
      const image = client.createImage();
      image.fillSolid(red);
      expect(image.getPixel(midpoint(small))).toEqual(red);
      client.dispose();
    });

    it('Supports loading pixels from array data', async () => {
      const client = factory(small);
      const image = client.createImage();
      const pixelData = TestImages.solidPixelData(small, green);
      await image.loadPixelDataAsync(pixelData);
      expect(image.getPixel(midpoint(small))).toEqual(green);
      client.dispose();
    });

    it('Supports loading pixels from array data with rescale', async () => {
      const client = factory(small);
      const image = client.createImage();
      const pixelData = TestImages.solidPixelData(medium, blue);
      await image.loadPixelDataAsync(pixelData, medium);
      expect(image.getPixel(midpoint(small))).toEqual(blue);
      client.dispose();
    });

    it('Supports loading pixels from array data (ImageBitmap disabled)', async () => {
      const client = factory(small);
      client.engineOptions.disableImageBitmap = true;
      const image = client.createImage();
      const pixelData = TestImages.solidPixelData(small, green);
      await image.loadPixelDataAsync(pixelData);
      expect(image.getPixel(midpoint(small))).toEqual(green);
      client.dispose();
    });

    it('Supports loading pixels from array data with rescale (ImageBitmap disabled)', async () => {
      const client = factory(small);
      client.engineOptions.disableImageBitmap = true;
      const image = client.createImage();
      const pixelData = TestImages.solidPixelData(medium, blue);
      await image.loadPixelDataAsync(pixelData, medium);
      expect(image.getPixel(midpoint(small))).toEqual(blue);
      client.dispose();
    });

    it('Supports debug mode, including tracing and warnings', () => {
      const client = factory(small);
      client.engineOptions.debugMode = true;
      client.engineOptions.showTracing = true;
      client.engineOptions.showWarnings = true;

      const image = client.createImage();
      image.fillSolid(red);

      image.releaseAllResources();
      client.releaseAllResources();
      client.dispose();
    });

  });
}
