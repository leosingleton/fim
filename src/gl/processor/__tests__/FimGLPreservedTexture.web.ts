// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimGLCapabilities } from '../../FimGLCapabilities';
import { FimGLPreservedTexture } from '../FimGLPreservedTexture';
import { Fim } from '../../../Fim';
import { ContextLost } from '../../../debug/ContextLost';
import { FimTestImages } from '../../../debug/FimTestImages';
import { FimColor } from '../../../primitives/FimColor';
import { FimRect } from '../../../primitives/FimRect';
import { DisposableSet } from '@leosingleton/commonlibs';

function expectToBeCloseTo(actual: FimColor, expected: FimColor): void {
  expect(actual.r).toBeCloseTo(expected.r, -1);
  expect(actual.g).toBeCloseTo(expected.g, -1);
  expect(actual.b).toBeCloseTo(expected.b, -1);  
  expect(actual.a).toBeCloseTo(expected.a, -1);  
}

describe('FimGLPreservedTexture', () => {

  it('Preserves texture across context loss', async () => {
    await DisposableSet.usingAsync(async disposable => {
      let fim = disposable.addDisposable(new Fim());
      let gl = disposable.addDisposable(fim.createGLCanvas(480, 480));

      // Create a preserved texture from the test pattern
      let jpeg = FimTestImages.fourSquaresJpeg();
      let canvas = disposable.addDisposable(await fim.createCanvasFromJpegAsync(jpeg));
      let texture = disposable.addDisposable(new FimGLPreservedTexture(gl));
      texture.copyFrom(canvas);
      texture.preserve();

      // Simulate context loss
      await ContextLost.loseContextAsync(gl);
      await ContextLost.restoreContextAsync(gl);

      // Render the texture to the WebGL canvas
      gl.copyFrom(texture);

      // Check a few pixels to ensure the texture rendered correctly
      expectToBeCloseTo(gl.getPixel(120, 120), FimColor.fromString('#f00'));
      expectToBeCloseTo(gl.getPixel(360, 120), FimColor.fromString('#0f0'));
      expectToBeCloseTo(gl.getPixel(120, 360), FimColor.fromString('#00f'));
      expectToBeCloseTo(gl.getPixel(360, 360), FimColor.fromString('#000'));

      // To be sure it works (and wasn't) an artifact of the restore process, render it again
      gl.fillCanvas('#fff');
      gl.copyFrom(texture);

      // Check a few pixels to ensure the texture rendered correctly
      expectToBeCloseTo(gl.getPixel(120, 120), FimColor.fromString('#f00'));
      expectToBeCloseTo(gl.getPixel(360, 120), FimColor.fromString('#0f0'));
      expectToBeCloseTo(gl.getPixel(120, 360), FimColor.fromString('#00f'));
      expectToBeCloseTo(gl.getPixel(360, 360), FimColor.fromString('#000'));
    });
  });

  it('Preserves textures with scissoring', async () => {
    // This test case creates a smaller texture than the WebGL canvas to test the case where FimGLPreservedTexture must
    // use scissoring to render the texture only on one corner of the canvas to preserve it.
    await DisposableSet.usingAsync(async disposable => {
      let fim = disposable.addDisposable(new Fim());
      let gl = disposable.addDisposable(fim.createGLCanvas(480, 480));

      // Create a preserved texture from the test pattern
      let jpeg = FimTestImages.fourSquaresJpeg();
      let canvas = disposable.addDisposable(await fim.createCanvasFromJpegAsync(jpeg));
      let texture = disposable.addDisposable(new FimGLPreservedTexture(gl, 120, 120));
      texture.copyFrom(canvas);
      texture.preserve();

      // Simulate context loss
      await ContextLost.loseContextAsync(gl);
      await ContextLost.restoreContextAsync(gl);

      // Render the texture to the WebGL canvas
      gl.copyFrom(texture);

      // Check a few pixels to ensure the texture rendered correctly
      expectToBeCloseTo(gl.getPixel(120, 120), FimColor.fromString('#f00'));
      expectToBeCloseTo(gl.getPixel(360, 120), FimColor.fromString('#0f0'));
      expectToBeCloseTo(gl.getPixel(120, 360), FimColor.fromString('#00f'));
      expectToBeCloseTo(gl.getPixel(360, 360), FimColor.fromString('#000'));

      // To be sure it works (and wasn't) an artifact of the restore process, render it again
      gl.fillCanvas('#fff');
      gl.copyFrom(texture);

      // Check a few pixels to ensure the texture rendered correctly
      expectToBeCloseTo(gl.getPixel(120, 120), FimColor.fromString('#f00'));
      expectToBeCloseTo(gl.getPixel(360, 120), FimColor.fromString('#0f0'));
      expectToBeCloseTo(gl.getPixel(120, 360), FimColor.fromString('#00f'));
      expectToBeCloseTo(gl.getPixel(360, 360), FimColor.fromString('#000'));
    });
  });

  it('Preserves textures with downscaling', async () => {
    // This test case is similar to the previous one which tests scissoring, but adds a WebGL canvas that has been
    // downscaled from the requested dimensions in order to not exceed GPU limits.
    await DisposableSet.usingAsync(async disposable => {
      // Find a canvas size bigger than the GPU can support and create a canvas of that size
      let fim = disposable.addDisposable(new Fim());
      let caps = FimGLCapabilities.getCapabilities(fim);
      let canvasSize = caps.maxRenderBufferSize + 1000;
      let gl = disposable.addDisposable(fim.createGLCanvas(canvasSize, canvasSize / 8));

      // Create a preserved texture from the test pattern. Make this one small.
      let jpeg = FimTestImages.fourSquaresJpeg();
      let canvas = disposable.addDisposable(await fim.createCanvasFromJpegAsync(jpeg));
      let texture = disposable.addDisposable(new FimGLPreservedTexture(gl, 480, 480));
      texture.copyFrom(canvas);
      texture.preserve();

      // Simulate context loss
      await ContextLost.loseContextAsync(gl);
      await ContextLost.restoreContextAsync(gl);

      // Render the texture to the WebGL canvas
      gl.copyFrom(texture, null, FimRect.fromXYWidthHeight(0, 0, 480, 480));

      // Check a few pixels to ensure the texture rendered correctly
      expectToBeCloseTo(gl.getPixel(120, 120), FimColor.fromString('#f00'));
      expectToBeCloseTo(gl.getPixel(360, 120), FimColor.fromString('#0f0'));
      expectToBeCloseTo(gl.getPixel(120, 360), FimColor.fromString('#00f'));
      expectToBeCloseTo(gl.getPixel(360, 360), FimColor.fromString('#000'));

      // To be sure it works (and wasn't) an artifact of the restore process, render it again to a different location
      gl.fillCanvas('#fff');
      gl.copyFrom(texture, null, FimRect.fromXYWidthHeight(200, 200, 200, 200));

      // Check a few pixels to ensure the texture rendered correctly
      expectToBeCloseTo(gl.getPixel(250, 250), FimColor.fromString('#f00'));
      expectToBeCloseTo(gl.getPixel(350, 250), FimColor.fromString('#0f0'));
      expectToBeCloseTo(gl.getPixel(250, 350), FimColor.fromString('#00f'));
      expectToBeCloseTo(gl.getPixel(350, 350), FimColor.fromString('#000'));
    });
  });

});
