// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimGLCanvas } from '../FimGLCanvas';
import { FimGLCapabilities } from '../FimGLCapabilities';
import { FimGLPreservedTexture } from '../FimGLPreservedTexture';
import { FimCanvas } from '../../image/FimCanvas';
import { FimColor, FimRect } from '../../primitives';
import { FimTestImages, ContextLost } from '../../test';
import { DisposableSet } from '@leosingleton/commonlibs';

function expectToBeCloseTo(actual: FimColor, expected: FimColor): void {
  expect(actual.r).toBeCloseTo(expected.r, -1);
  expect(actual.g).toBeCloseTo(expected.g, -1);
  expect(actual.b).toBeCloseTo(expected.b, -1);  
  expect(actual.a).toBeCloseTo(expected.a, -1);  
}

describe('FimGLPreservedTexture', () => {

  it('Preserves texture across context loss', async () => {
    DisposableSet.usingAsync(async disposable => {
      let gl = disposable.addDisposable(new FimGLCanvas(480, 480));
      
      // Create a preserved texture from the test pattern
      let jpeg = FimTestImages.fourSquaresJpeg();
      let canvas = disposable.addDisposable(await FimCanvas.createFromJpeg(jpeg));
      let texture = disposable.addDisposable(new FimGLPreservedTexture(gl));
      texture.getTexture().copyFrom(canvas);

      // Simulate context loss
      await ContextLost.loseContextAsync(gl);
      await ContextLost.restoreContextAsync(gl);

      // Render the texture to the WebGL canvas
      gl.copyFrom(texture.getTexture());

      // Check a few pixels to ensure the texture rendered correctly
      expectToBeCloseTo(gl.getPixel(120, 120), FimColor.fromString('#f00'));
      expectToBeCloseTo(gl.getPixel(360, 120), FimColor.fromString('#0f0'));
      expectToBeCloseTo(gl.getPixel(120, 360), FimColor.fromString('#00f'));
      expectToBeCloseTo(gl.getPixel(360, 360), FimColor.fromString('#000'));
      
      // To be sure it works (and wasn't) an artifact of the restore process, render it again
      gl.fill('#fff');
      gl.copyFrom(texture.getTexture());

      // Check a few pixels to ensure the texture rendered correctly
      expectToBeCloseTo(gl.getPixel(120, 120), FimColor.fromString('#f00'));
      expectToBeCloseTo(gl.getPixel(360, 120), FimColor.fromString('#0f0'));
      expectToBeCloseTo(gl.getPixel(120, 360), FimColor.fromString('#00f'));
      expectToBeCloseTo(gl.getPixel(360, 360), FimColor.fromString('#000'));
    });
  });

  it('Preserves textures with downscaling', async () => {
    DisposableSet.usingAsync(async disposable => {
      // Find a canvas size bigger than the GPU can support and create a canvas of that size
      let caps = FimGLCapabilities.getCapabilities();
      let canvasSize = caps.maxRenderBufferSize + 1000;
      let gl = disposable.addDisposable(new FimGLCanvas(canvasSize, canvasSize / 8));
      
      // Create a preserved texture from the test pattern. Make this one small.
      let jpeg = FimTestImages.fourSquaresJpeg();
      let canvas = disposable.addDisposable(await FimCanvas.createFromJpeg(jpeg));
      let texture = disposable.addDisposable(new FimGLPreservedTexture(gl, 480, 480));
      texture.getTexture().copyFrom(canvas);

      // Simulate context loss
      await ContextLost.loseContextAsync(gl);
      await ContextLost.restoreContextAsync(gl);

      // Render the texture to the WebGL canvas
      gl.copyFrom(texture.getTexture());

      // Check a few pixels to ensure the texture rendered correctly
      expectToBeCloseTo(gl.getPixel(120, 120), FimColor.fromString('#f00'));
      expectToBeCloseTo(gl.getPixel(360, 120), FimColor.fromString('#0f0'));
      expectToBeCloseTo(gl.getPixel(120, 360), FimColor.fromString('#00f'));
      expectToBeCloseTo(gl.getPixel(360, 360), FimColor.fromString('#000'));
      
      // To be sure it works (and wasn't) an artifact of the restore process, render it again to a different location
      gl.fill('#fff');
      gl.copyFrom(texture.getTexture(), null, FimRect.fromXYWidthHeight(200, 200, 200, 200));

      // Check a few pixels to ensure the texture rendered correctly
      expectToBeCloseTo(gl.getPixel(250, 250), FimColor.fromString('#f00'));
      expectToBeCloseTo(gl.getPixel(350, 250), FimColor.fromString('#0f0'));
      expectToBeCloseTo(gl.getPixel(250, 350), FimColor.fromString('#00f'));
      expectToBeCloseTo(gl.getPixel(350, 350), FimColor.fromString('#000'));
    });
  });

});
