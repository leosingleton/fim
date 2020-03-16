// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { large } from '../common/Globals';
import { TestPatterns } from '../common/TestPatterns';
import { usingAsync } from '@leosingleton/commonlibs';
import { Fim, FimDimensions, FimOpDownscale, FimTextureSampling } from '@leosingleton/fim';

/** FimOpDownscale unit tests */
export function fimTestSuiteOpDownscale(
  description: string,
  factory: (maxImageDimensions: FimDimensions) => Fim
): void {
  xdescribe(`FimOpDownscale - ${description}`, () => {
    it('Downscales at 4x', () => testDownscale(factory, 4));
    it('Downscales at 8x', () => testDownscale(factory, 8));
    it('Downscales at 16x', () => testDownscale(factory, 16));
    //it('Downscales at 24x', () => testDownscale(factory, 24));
    it('Downscales at 32x', () => testDownscale(factory, 32));
    //it('Downscales at 48x', () => testDownscale(factory, 48));
    it('Downscales at 64x', () => testDownscale(factory, 64));
    //it('Downscales at 96x', () => testDownscale(factory, 96));
    it('Downscales at 128x', () => testDownscale(factory, 128));
  });
}

async function testDownscale(
  factory: (maxImageDimensions: FimDimensions) => Fim,
  ratio: number
): Promise<void> {
  await usingAsync(factory(large), async fim => {
    // Draw the test pattern on a 512x256 image
    const inputDimensions = FimDimensions.fromWidthHeight(512, 256);
    const input = fim.createImage(inputDimensions);
    input.imageOptions.sampling = FimTextureSampling.Linear;
    await TestPatterns.renderAsync(input, TestPatterns.downscaleStress);

    // Run the downscale program
    const outputDimensions = inputDimensions.rescale(1 / ratio);
    const output = fim.createImage(outputDimensions);
    const op = new FimOpDownscale(fim);
    op.setInput(input);
    await output.executeAsync(op);

    // Sample a pixel in the center. It should be 50% grey
    const color = await output.getPixelAsync(outputDimensions.getCenter());
    const min = 127 - 3;
    const max = 127 + 3;
    expect(color.r).toBeGreaterThan(min);
    expect(color.r).toBeLessThan(max);
    expect(color.g).toBeGreaterThan(min);
    expect(color.g).toBeLessThan(max);
    expect(color.b).toBeGreaterThan(min);
    expect(color.b).toBeLessThan(max);
    expect(color.a).toEqual(255);
  });
}
