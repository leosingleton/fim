// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimGLCanvas } from '../FimGLCanvas';
import { FimGLCapabilities } from '../FimGLCapabilities';
import { FimGLTexture } from '../FimGLTexture';
import { FimGLProgramCopy } from '../programs';
import { FimCanvas } from '../../image';
import { FimColor } from '../../primitives';
import { FimTestImages } from '../../test';
import { DisposableSet, using } from '@leosingleton/commonlibs';

function expectToBeCloseTo(actual: FimColor, expected: FimColor): void {
  expect(actual.r).toBeCloseTo(expected.r, -1);
  expect(actual.g).toBeCloseTo(expected.g, -1);
  expect(actual.b).toBeCloseTo(expected.b, -1);  
  expect(actual.a).toBeCloseTo(expected.a, -1);  
}

function spec(useOffscreenCanvas: boolean) {
  return () => {
    it('Creates and disposes', () => {
      let b = new FimGLCanvas(640, 480, undefined, useOffscreenCanvas);
      expect(b.getCanvas()).toBeDefined();

      b.dispose();
      expect(b.getCanvas()).toBeUndefined();

      // Double-dispose
      b.dispose();
      expect(b.getCanvas()).toBeUndefined();
    });

    it('Fills with a solid color', () => {
      using(new FimGLCanvas(640, 480, undefined, useOffscreenCanvas), c => {
        c.fill('#f00');
        expectToBeCloseTo(c.getPixel(300, 200), FimColor.fromString('#f00'));
      });
    });

    it('Renders a JPEG texture', async () => {
      DisposableSet.usingAsync(async disposable => {
        // Initialize the WebGL canvas, program, and a texture loaded from a JPEG image
        let canvas = disposable.addDisposable(new FimGLCanvas(128, 128, undefined, useOffscreenCanvas));
        let program = disposable.addDisposable(new FimGLProgramCopy(canvas));
        let jpeg = FimTestImages.fourSquaresJpeg();
        let buffer = disposable.addDisposable(await FimCanvas.createFromJpeg(jpeg, useOffscreenCanvas));
        let texture = disposable.addDisposable(FimGLTexture.createFrom(canvas, buffer));

        // Copy the texture
        program.setInputs(texture);
        program.execute();

        // We intentionally avoid one pixel from each edge, as the color is a bit off due to JPEG compression
        expectToBeCloseTo(canvas.getPixel(1, 1), FimColor.fromString('#f00'));
        expectToBeCloseTo(canvas.getPixel(32, 32), FimColor.fromString('#f00'));
        expectToBeCloseTo(canvas.getPixel(62, 62), FimColor.fromString('#f00'));
        expectToBeCloseTo(canvas.getPixel(96, 32), FimColor.fromString('#0f0'));
        expectToBeCloseTo(canvas.getPixel(126, 0), FimColor.fromString('#0f0'));
        expectToBeCloseTo(canvas.getPixel(126, 62), FimColor.fromString('#0f0'));
        expectToBeCloseTo(canvas.getPixel(1, 126), FimColor.fromString('#00f'));
        expectToBeCloseTo(canvas.getPixel(32, 96), FimColor.fromString('#00f'));
        expectToBeCloseTo(canvas.getPixel(62, 65), FimColor.fromString('#00f'));
        expectToBeCloseTo(canvas.getPixel(65, 65), FimColor.fromString('#000'));
        expectToBeCloseTo(canvas.getPixel(96, 96), FimColor.fromString('#000'));
        expectToBeCloseTo(canvas.getPixel(126, 126), FimColor.fromString('#000'));
      });
    });

    it('Downscales oversized canvases', async () => {
      await DisposableSet.usingAsync(async disposable => {
        // Find a canvas size bigger than the GPU can support and create a canvas of that size
        let caps = FimGLCapabilities.getCapabilities();
        let canvasSize = caps.maxRenderBufferSize + 1000;
        let gl = disposable.addDisposable(new FimGLCanvas(canvasSize, canvasSize / 2));
        expect(gl.downscaled).toBeTruthy();
        expect(gl.w).toBe(caps.maxRenderBufferSize);
        expect(gl.h).toBe(caps.maxRenderBufferSize / 2);
        expect(gl.downscaleRatio).toBe(canvasSize / caps.maxRenderBufferSize);

        // Create a test image the original size of the canvas
        let texture = disposable.addDisposable(new FimGLTexture(gl, canvasSize, canvasSize / 2));
        let jpeg = FimTestImages.fourSquaresJpeg();
        let buffer = disposable.addDisposable(await FimCanvas.createFromJpeg(jpeg));
        texture.copyFrom(buffer);
  
        // Render the texture to the WebGL canvas
        let program = disposable.addDisposable(new FimGLProgramCopy(gl));
        program.setInputs(texture);
        program.execute();
  
        // Check a few pixels to ensure the texture rendered correctly
        let left = canvasSize / 4;
        let right = canvasSize * 3 / 4;
        let top = canvasSize / 8;
        let bottom = canvasSize * 3 / 8;
        expectToBeCloseTo(gl.getPixel(left, top), FimColor.fromString('#f00'));
        expectToBeCloseTo(gl.getPixel(right, top), FimColor.fromString('#0f0'));
        expectToBeCloseTo(gl.getPixel(left, bottom), FimColor.fromString('#00f'));
        expectToBeCloseTo(gl.getPixel(right, bottom), FimColor.fromString('#000'));
      });
    });  
  };
}

describe('FimGLCanvas(OffScreenCanvas=false)', spec(false));

// Only run OffscreenCanvas tests on browsers that support it
if (FimGLCanvas.supportsOffscreenCanvas) {
  describe('FimGLCanvas(OffScreenCanvas=true)', spec(true));
}
