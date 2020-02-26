// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { Fim, FimColor, FimDimensions, FimImage, FimShader } from '@leosingleton/fim';

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
      const client = factory(FimDimensions.fromWidthHeight(100, 100));
      client.dispose();

      // Double-dispose throws an exception
      expect(() => client.dispose()).toThrow();
    });

    it('Handles multiple releaseAllResources() calls', () => {
      const client = factory(FimDimensions.fromWidthHeight(100, 100));
      client.releaseAllResources();
      client.releaseAllResources();
      client.releaseAllResources();
      client.dispose();
    });

    it('Detects WebGL capabilities', () => {
      const client = factory(FimDimensions.fromWidthHeight(100, 100));
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
      const client = factory(FimDimensions.fromWidthHeight(100, 100));

      const img1 = client.createImage();
      img1.fillSolid('#f00');
      img1.dispose();

      const img2 = client.createImage();
      img2.fillSolid('#00f');
      img2.dispose();

      client.dispose();
    });

    it('Supports fillSolid() and getPixelAsync()', async () => {
      const client = factory(FimDimensions.fromWidthHeight(100, 100));
      const image = client.createImage();
      image.fillSolid('#f00');

      const color = await image.getPixelAsync(50, 50);
      expect(color).toEqual(FimColor.fromString('#f00'));

      client.dispose();
    });

    it('Supports debug mode, including tracing and warnings', () => {
      const client = factory(FimDimensions.fromWidthHeight(100, 100));
      client.engineOptions.debugMode = true;
      client.engineOptions.showTracing = true;
      client.engineOptions.showWarnings = true;

      const image = client.createImage();
      image.fillSolid('#f00');

      image.releaseAllResources();
      client.releaseAllResources();
      client.dispose();
    });

  });
}
