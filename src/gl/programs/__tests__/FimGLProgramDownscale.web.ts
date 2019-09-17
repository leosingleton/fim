// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimGLProgramDownscale } from '../FimGLProgramDownscale';
import { FimGLCanvas } from '../../FimGLCanvas';
import { FimGLTexture, FimGLTextureFlags } from '../../FimGLTexture';
import { Fim } from '../../../Fim';
import { FimTestPatterns } from '../../../debug/FimTestPatterns';
import { DisposableSet } from '@leosingleton/commonlibs';

async function testDownscale(ratio: number): Promise<void> {
  await DisposableSet.usingAsync(async disposable => {
    let fim = disposable.addDisposable(new Fim());

    // Build the test pattern
    let testBuffer = disposable.addDisposable(fim.createRgbaBuffer(512, 16));
    FimTestPatterns.render(testBuffer, FimTestPatterns.downscaleStress);

    // Copy the test pattern to a canvas and draw it
    let test = disposable.addDisposable(fim.createCanvas(testBuffer.w, testBuffer.h));
    await test.copyFromAsync(testBuffer);

    let canvas = disposable.addDisposable(fim.createGLCanvas(512 / ratio, 16));
    let program = disposable.addDisposable(new FimGLProgramDownscale(canvas, ratio, 1));
    let flags = FimGLTextureFlags.LinearSampling | FimGLTextureFlags.AllowLargerThanCanvas;
    let texture = disposable.addDisposable(FimGLTexture.createFrom(canvas as FimGLCanvas, test, flags));

    program.setInputs(texture);
    program.execute();

    // Sample a pixel in the center. It should be 50% grey
    let color = canvas.getPixel(canvas.w / 2, canvas.h / 2);
    let min = 127 - 3;
    let max = 127 + 3;
    expect(color.r).toBeGreaterThan(min);
    expect(color.r).toBeLessThan(max);
    expect(color.g).toBeGreaterThan(min);
    expect(color.g).toBeLessThan(max);
    expect(color.b).toBeGreaterThan(min);
    expect(color.b).toBeLessThan(max);
    expect(color.a).toEqual(255);
  });
}

describe('FimGLProgramDownscale', () => {
  it('Downscales at 4x', () => testDownscale(4));
  it('Downscales at 8x', () => testDownscale(8));
  it('Downscales at 16x', () => testDownscale(16));
  //it('Downscales at 24x', () => testDownscale(24));
  it('Downscales at 32x', () => testDownscale(32));
  //it('Downscales at 48x', () => testDownscale(48));
  it('Downscales at 64x', () => testDownscale(64));
  //it('Downscales at 96x', () => testDownscale(96));
  it('Downscales at 128x', () => testDownscale(128));
});
