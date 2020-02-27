// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { Fim, FimColor, FimDimensions, FimImage, FimShader } from '@leosingleton/fim';
import { TestImages } from '../common/TestImages';

/** Small 100x100 canvas dimensions */
const small = FimDimensions.fromWidthHeight(100, 100);

/** Medium 500x500 canvas dimensions */
const medium = FimDimensions.fromWidthHeight(500, 500);

const red = FimColor.fromString('#f00');
const green = FimColor.fromString('#0f0');
const blue = FimColor.fromString('#00f');

/**
 * Executes a suite of common tests using the FIM client created via factory methods
 * @param description Description to show in the test framework
 * @param factory Lambda to call FimXYZFactory.create()
 */
export function clientAndFactoryBasicSuite(
  description: string,
  factory: (maxImageDimensions: FimDimensions) => Fim<FimImage, FimShader>
): void {
  describe(description, () => {

    it('Creates and disposes', () => {
      const client = factory(small);
      client.dispose();

      // Double-dispose throws an exception
      expect(() => client.dispose()).toThrow();
    });

    it('Handles multiple releaseAllResources() calls', () => {
      const client = factory(small);
      client.releaseAllResources();
      client.releaseAllResources();
      client.releaseAllResources();
      client.dispose();
    });

    it('Detects WebGL capabilities', () => {
      const client = factory(small);
      const caps = client.capabilities;
      expect(caps.glVersion.length).toBeGreaterThan(0);
      expect(caps.glShadingLanguageVersion.length).toBeGreaterThan(0);
      expect(caps.glVendor.length).toBeGreaterThan(0);
      expect(caps.glRenderer.length).toBeGreaterThan(0);
      // Skip glUnmaskedVendor and glUnmaskedRenderer because they are sometimes empty strings
      expect(caps.glMaxRenderBufferSize).toBeGreaterThanOrEqual(1024);
      expect(caps.glMaxTextureImageUnits).toBeGreaterThanOrEqual(4);
      expect(caps.glMaxTextureSize).toBeGreaterThanOrEqual(1024);
      expect(caps.glExtensions.length).toBeGreaterThan(0);
      client.dispose();
    });

    it('Creates and disposes images', () => {
      const client = factory(small);

      const img1 = client.createImage();
      img1.fillSolid(red);
      img1.dispose();

      const img2 = client.createImage();
      img2.fillSolid(blue);
      img2.dispose();

      client.dispose();
    });

    it('Supports fillSolid() and getPixel()', () => {
      const client = factory(small);
      const image = client.createImage();
      image.fillSolid(red);
      expect(image.getPixel(50, 50)).toEqual(red);
      client.dispose();
    });

    it('Supports loading pixels from array data', async () => {
      const client = factory(small);
      const image = client.createImage();
      const pixelData = TestImages.solidPixelData(small, green);
      await image.loadPixelDataAsync(pixelData);
      expect(image.getPixel(50, 50)).toEqual(green);
      client.dispose();
    });

    it('Supports loading pixels from array data with rescale', async () => {
      const client = factory(small);
      const image = client.createImage();
      const pixelData = TestImages.solidPixelData(medium, blue);
      await image.loadPixelDataAsync(pixelData, medium);
      expect(image.getPixel(50, 50)).toEqual(blue);
      client.dispose();
    });

    it('Supports loading pixels from array data (ImageBitmap disabled)', async () => {
      const client = factory(small);
      client.engineOptions.disableImageBitmap = true;
      const image = client.createImage();
      const pixelData = TestImages.solidPixelData(small, green);
      await image.loadPixelDataAsync(pixelData);
      expect(image.getPixel(50, 50)).toEqual(green);
      client.dispose();
    });

    it('Supports loading pixels from array data with rescale (ImageBitmap disabled)', async () => {
      const client = factory(small);
      client.engineOptions.disableImageBitmap = true;
      const image = client.createImage();
      const pixelData = TestImages.solidPixelData(medium, blue);
      await image.loadPixelDataAsync(pixelData, medium);
      expect(image.getPixel(50, 50)).toEqual(blue);
      client.dispose();
    });

    it('Exports to PNG', async () => {
      const client = factory(small);
      const image = client.createImage();
      image.fillSolid(red);
      const png = await image.exportToPngAsync();

      // PNG magic number is 89 50 4E 47 (ASCII for .PNG)
      expect(png[0]).toBe(0x89);
      expect(png[1]).toBe(0x50);
      expect(png[2]).toBe(0x4e);
      expect(png[3]).toBe(0x47);

      client.dispose();
    });

    it('Exports to JPEG', async () => {
      const client = factory(small);
      const image = client.createImage();
      image.fillSolid(red);
      const jpeg = await image.exportToJpegAsync();

      // JPEG magic number is FF D8 FF
      expect(jpeg[0]).toBe(0xff);
      expect(jpeg[1]).toBe(0xd8);
      expect(jpeg[2]).toBe(0xff);

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
