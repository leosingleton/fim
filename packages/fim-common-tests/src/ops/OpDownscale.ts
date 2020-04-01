// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { expectErrorAsync } from '../common/Async';
import { TestColors } from '../common/TestColors';
import { TestPatterns } from '../common/TestPatterns';
import { TestSizes } from '../common/TestSizes';
import { usingAsync } from '@leosingleton/commonlibs';
import { Fim, FimDimensions, FimImage, FimOpDownscale, FimTextureSampling, FimError } from '@leosingleton/fim';

/** FimOpDownscale unit tests */
export function fimTestSuiteOpDownscale(
  description: string,
  factory: (maxImageDimensions: FimDimensions) => Fim
): void {
  describe(`FimOpDownscale - ${description}`, () => {
    it('Downscales at 4x', async () => testAndValidateDownscale(factory, 4));
    it('Downscales at 8x', async () => testAndValidateDownscale(factory, 8));
    it('Downscales at 16x', async () => testAndValidateDownscale(factory, 16));
    it('Downscales at 24x', async () => testAndValidateDownscale(factory, 24, undefined, 0.1));
    it('Downscales at 32x', async () => testAndValidateDownscale(factory, 32));
    it('Downscales at 48x', async () => testAndValidateDownscale(factory, 48, undefined, 0.2));
    it('Downscales at 64x', async () => testAndValidateDownscale(factory, 64));
    it('Downscales at 96x', async () => testAndValidateDownscale(factory, 96));
    it('Downscales at 128x', async () => testAndValidateDownscale(factory, 128));
    it('Downscales at 128x (wide)', async () => testAndValidateDownscale(factory, 128,
      FimDimensions.fromWidthHeight(480, 240)));

    it('Performs a copy at 1x', async () => {
      await usingAsync(factory(TestSizes.small), async fim => {
        const output = await testDownscale(fim, 1, TestSizes.small);
        await TestPatterns.validateAsync(output, TestPatterns.downscaleStress, true);
      });
    });

    it('Fails to downscale more than 128x', async () => {
      (await expectErrorAsync(testAndValidateDownscale(factory, 256))).toBeInstanceOf(FimError);
    });

    it('Fails if input is non-linear', async () => {
      await usingAsync(factory(TestSizes.small), async fim => {
        (await expectErrorAsync(testDownscale(fim, 1, TestSizes.small, false))).toBeInstanceOf(FimError);
      });
    });
  });
}

async function testDownscale(
  fim: Fim,
  ratio: number,
  inputDimensions: FimDimensions,
  linear = true
): Promise<FimImage> {
  const downscale = new FimOpDownscale(fim);

  // Draw the test pattern
  const input = fim.createImage({}, inputDimensions);
  input.imageOptions.sampling = linear ? FimTextureSampling.Linear : FimTextureSampling.Nearest;
  await TestPatterns.renderAsync(input, TestPatterns.downscaleStress);

  // Run the downscale program
  const output = fim.createImage({}, inputDimensions.rescale(1 / ratio));
  await output.executeAsync(downscale.$(input));

  return output;
}

async function testAndValidateDownscale(
  factory: (maxImageDimensions: FimDimensions) => Fim,
  ratio: number,
  inputDimensions = FimDimensions.fromWidthHeight(256, 512),
  maxError = 0.05
): Promise<void> {
  await usingAsync(factory(TestSizes.medium), async fim => {
    // Run the downscale operation and sample a pixel in the center. It should be 50% grey.
    const output = await testDownscale(fim, ratio, inputDimensions);
    const color = await output.getPixelAsync(output.dim.getCenter());
    expect(color.distance(TestColors.grey)).toBeLessThan(maxError);
  });
}
