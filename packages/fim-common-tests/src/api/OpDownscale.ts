// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { grey, medium } from '../common/Globals';
import { TestPatterns } from '../common/TestPatterns';
import { usingAsync } from '@leosingleton/commonlibs';
import { Fim, FimDimensions, FimImage, FimOpDownscale, FimTextureSampling } from '@leosingleton/fim';

/** FimOpDownscale unit tests */
export function fimTestSuiteOpDownscale(
  description: string,
  factory: (maxImageDimensions: FimDimensions) => Fim
): void {
  describe(`FimOpDownscale - ${description}`, () => {
    it('Downscales at 4x', async () => testAndValidateDownscale(factory, 4));
    it('Downscales at 8x', async () => testAndValidateDownscale(factory, 8));
    it('Downscales at 16x', async () => testAndValidateDownscale(factory, 16));
    it('Downscales at 24x', async () => testAndValidateDownscale(factory, 24, 0.1));
    it('Downscales at 32x', async () => testAndValidateDownscale(factory, 32));
//    it('Downscales at 48x', async () => testAndValidateDownscale(factory, 48, 0.2));
//    it('Downscales at 64x', async () => testAndValidateDownscale(factory, 64));
    //it('Downscales at 96x', async () => testAndValidateDownscale(factory, 96));
//    it('Downscales at 128x', async () => testAndValidateDownscale(factory, 128));

    xit('Performs a copy at 1x', async () => {
      await usingAsync(factory(medium), async fim => {
        const output = await testDownscale(fim, 1);
        await TestPatterns.validateAsync(output, TestPatterns.downscaleStress, true);
      });
    });
  });
}

async function testDownscale(
  fim: Fim,
  ratio: number
): Promise<FimImage> {
  // Draw the test pattern on a 256x512 image
  const inputDimensions = FimDimensions.fromWidthHeight(256, 512);
  const input = fim.createImage(inputDimensions);
  input.imageOptions.sampling = FimTextureSampling.Linear;
  await TestPatterns.renderAsync(input, TestPatterns.downscaleStress);

  // Run the downscale program
  const output = fim.createImage(inputDimensions.rescale(1 / ratio));
  const op = new FimOpDownscale(fim);
  op.setInput(input);
  await output.executeAsync(op);

  return output;
}

async function testAndValidateDownscale(
  factory: (maxImageDimensions: FimDimensions) => Fim,
  ratio: number,
  maxError = 0.05
): Promise<void> {
  await usingAsync(factory(medium), async fim => {
    // Run the downscale operation and sample a pixel in the center. It should be 50% grey.
    const output = await testDownscale(fim, ratio);
    const color = await output.getPixelAsync(output.imageDimensions.getCenter());
    expect(color.distance(grey)).toBeLessThan(maxError);
  });
}
