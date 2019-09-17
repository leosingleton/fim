// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimGLCapabilities } from '../FimGLCapabilities';
import { FimGLProgramCopy } from '../programs/FimGLProgramCopy';
import { Fim } from '../../Fim';
import { FimTestImages } from '../../debug/FimTestImages';
import { FimCanvasFactory, FimDomCanvasFactory, FimOffscreenCanvasFactory } from '../../image/FimCanvasFactory';
import { FimColor } from '../../primitives/FimColor';
import { FimRect } from '../../primitives/FimRect';
import { DisposableSet, using } from '@leosingleton/commonlibs';

function expectToBeCloseTo(actual: FimColor, expected: FimColor): void {
  expect(actual.r).toBeCloseTo(expected.r, -1);
  expect(actual.g).toBeCloseTo(expected.g, -1);
  expect(actual.b).toBeCloseTo(expected.b, -1);  
  expect(actual.a).toBeCloseTo(expected.a, -1);  
}

function spec(canvasFactory: FimCanvasFactory) {
  return () => {
    it('Creates and disposes', () => {
      using(new Fim(canvasFactory), fim => {
        let b = fim.createGLCanvas(640, 480);
        expect(b.getCanvas()).toBeDefined();
  
        b.dispose();
        expect(b.getCanvas()).toBeUndefined();
  
        // Double-dispose
        b.dispose();
        expect(b.getCanvas()).toBeUndefined();  
      });
    });

    it('Fills with a solid color', () => {
      using(new Fim(canvasFactory), fim => {
        using(fim.createGLCanvas(640, 480), c => {
          c.fillCanvas('#f00');
          expect(c.getPixel(300, 200)).toEqual(FimColor.fromString('#f00'));
          c.fillCanvas('#0f0');
          expect(c.getPixel(300, 200)).toEqual(FimColor.fromString('#0f0'));
          c.fillCanvas('#00f');
          expect(c.getPixel(300, 200)).toEqual(FimColor.fromString('#00f'));
        });
      });
    });

    it('Renders a JPEG texture', async () => {
      await DisposableSet.usingAsync(async disposable => {
        // Initialize the WebGL canvas, program, and a texture loaded from a JPEG image
        let fim = disposable.addDisposable(new Fim(canvasFactory));
        let canvas = disposable.addDisposable(fim.createGLCanvas(128, 128));
        let program = disposable.addDisposable(new FimGLProgramCopy(canvas));
        let jpeg = FimTestImages.fourSquaresJpeg();
        let buffer = disposable.addDisposable(await fim.createCanvasFromJpegAsync(jpeg));
        let texture = disposable.addDisposable(canvas.createTextureFrom(buffer));

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
        let fim = disposable.addDisposable(new Fim(canvasFactory));
        let caps = FimGLCapabilities.getCapabilities(fim);
        let canvasSize = caps.maxRenderBufferSize + 1000;
        let gl = disposable.addDisposable(fim.createGLCanvas(canvasSize, canvasSize / 8));
        expect(gl.realDimensions).toBeDefined();
        expect(gl.realDimensions.w).toBe(caps.maxRenderBufferSize);
        expect(gl.realDimensions.h).toBe(caps.maxRenderBufferSize / 8);
        expect(gl.downscaleRatio).toBe(caps.maxRenderBufferSize / canvasSize);
        expect(gl.getCanvas().width).toBe(gl.realDimensions.w);
        expect(gl.getCanvas().height).toBe(gl.realDimensions.h);

        // Create a test image the original size of the canvas
        let texture = disposable.addDisposable(gl.createTexture(canvasSize, canvasSize / 8));
        let jpeg = FimTestImages.fourSquaresJpeg();
        let buffer = disposable.addDisposable(await fim.createCanvasFromJpegAsync(jpeg));
        texture.copyFrom(buffer);
  
        // Render the texture to the WebGL canvas
        let program = disposable.addDisposable(new FimGLProgramCopy(gl));
        program.setInputs(texture);
        program.execute();
  
        // Check a few pixels to ensure the texture rendered correctly
        let left = canvasSize / 4;
        let right = canvasSize * 3 / 4;
        let top = canvasSize / 32;
        let bottom = canvasSize * 3 / 32;
        expectToBeCloseTo(gl.getPixel(left, top), FimColor.fromString('#f00'));
        expectToBeCloseTo(gl.getPixel(right, top), FimColor.fromString('#0f0'));
        expectToBeCloseTo(gl.getPixel(left, bottom), FimColor.fromString('#00f'));
        expectToBeCloseTo(gl.getPixel(right, bottom), FimColor.fromString('#000'));
      });
    });

    it('Copies from textures', async () => {
      await DisposableSet.usingAsync(async disposable => {
        let fim = disposable.addDisposable(new Fim(canvasFactory));
        let gl = disposable.addDisposable(fim.createGLCanvas(240, 240));

        // Create a test image the size of the canvas
        let texture = disposable.addDisposable(gl.createTexture(240, 240));
        let jpeg = FimTestImages.fourSquaresJpeg();
        let buffer = disposable.addDisposable(await fim.createCanvasFromJpegAsync(jpeg));
        texture.copyFrom(buffer);

        // Copy the texture
        gl.copyFrom(texture);

        // Check a few pixels to ensure the texture rendered correctly
        expectToBeCloseTo(gl.getPixel(60, 60), FimColor.fromString('#f00'));
        expectToBeCloseTo(gl.getPixel(180, 60), FimColor.fromString('#0f0'));
        expectToBeCloseTo(gl.getPixel(60, 180), FimColor.fromString('#00f'));
        expectToBeCloseTo(gl.getPixel(180, 180), FimColor.fromString('#000'));
      });
    });

    it('Copies from textures with srcCoords', async () => {
      await DisposableSet.usingAsync(async disposable => {
        let fim = disposable.addDisposable(new Fim(canvasFactory));
        let gl = disposable.addDisposable(fim.createGLCanvas(240, 240));

        // Create a test image the size of the canvas
        let texture = disposable.addDisposable(gl.createTexture(240, 240));
        let jpeg = FimTestImages.fourSquaresJpeg();
        let buffer = disposable.addDisposable(await fim.createCanvasFromJpegAsync(jpeg));
        texture.copyFrom(buffer);

        // Copy the texture
        gl.copyFrom(texture, FimRect.fromXYWidthHeight(texture.w / 2, 0, texture.w / 2, texture.h / 2));

        // Check a few pixels to ensure the texture rendered correctly
        expectToBeCloseTo(gl.getPixel(60, 60), FimColor.fromString('#0f0'));
        expectToBeCloseTo(gl.getPixel(180, 60), FimColor.fromString('#0f0'));
        expectToBeCloseTo(gl.getPixel(60, 180), FimColor.fromString('#0f0'));
        expectToBeCloseTo(gl.getPixel(180, 180), FimColor.fromString('#0f0'));
      });
    });

    it('Copies from textures with srcCoords and destCoords', async () => {
      await DisposableSet.usingAsync(async disposable => {
        let fim = disposable.addDisposable(new Fim(canvasFactory));
        let gl = disposable.addDisposable(fim.createGLCanvas(240, 240, '#00f'));

        // Create a test image the size of the canvas
        let texture = disposable.addDisposable(gl.createTexture(240, 240));
        let jpeg = FimTestImages.fourSquaresJpeg();
        let buffer = disposable.addDisposable(await fim.createCanvasFromJpegAsync(jpeg));
        texture.copyFrom(buffer);

        // Copy the texture
        gl.copyFrom(texture,
          FimRect.fromXYWidthHeight(0, 0, texture.w / 2, texture.h / 2),
          FimRect.fromXYWidthHeight(120, 120, 120, 120));

        // Check a few pixels to ensure the texture rendered correctly
        expectToBeCloseTo(gl.getPixel(60, 60), FimColor.fromString('#00f'));
        expectToBeCloseTo(gl.getPixel(180, 60), FimColor.fromString('#00f'));
        expectToBeCloseTo(gl.getPixel(60, 180), FimColor.fromString('#00f'));
        expectToBeCloseTo(gl.getPixel(180, 180), FimColor.fromString('#f00'));
      });
    });
  };
}

describe('FimGLCanvas(OffScreenCanvas=false)', spec(FimDomCanvasFactory));

// Only run OffscreenCanvas tests on browsers that support it
if (Fim.supportsOffscreenCanvas) {
  describe('FimGLCanvas(OffScreenCanvas=true)', spec(FimOffscreenCanvasFactory));
}
