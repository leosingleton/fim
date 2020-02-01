// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimGLTextureFlags, FimGLTextureOptions } from '../FimGLTexture';
import { FimGLProgramCopy } from '../programs/FimGLProgramCopy';
import { FimWeb } from '../../Fim';
import { FimTestImages } from '../../debug/FimTestImages';
import { FimDomCanvasFactory, FimOffscreenCanvasFactory } from '../../image/FimCanvasFactory';
import { FimBitsPerPixel } from '../../primitives/FimBitsPerPixel';
import { FimColor } from '../../primitives/FimColor';
import { FimColorChannels } from '../../primitives/FimColorChannels';
import { DisposableSet, using } from '@leosingleton/commonlibs';

function expectToBeCloseTo(actual: FimColor, expected: FimColor): void {
  expect(actual.r).toBeCloseTo(expected.r, -1);
  expect(actual.g).toBeCloseTo(expected.g, -1);
  expect(actual.b).toBeCloseTo(expected.b, -1);
  expect(actual.a).toBeCloseTo(expected.a, -1);
}

describe('FimGLTexture', () => {
  it('Supports all combinations of channels, bits per pixel, and flags', () => {
    DisposableSet.using(disposable => {
      // Create a WebGL canvas, plus a 2D grey canvas
      const fim = disposable.addDisposable(new FimWeb());
      const gl = disposable.addDisposable(fim.createGLCanvas(240, 240));
      const program = disposable.addDisposable(new FimGLProgramCopy(gl));
      const canvas = disposable.addDisposable(fim.createCanvas(240, 240, '#888'));

      [FimColorChannels.Greyscale, FimColorChannels.RGB, FimColorChannels.RGBA].forEach(channels => {
        [FimBitsPerPixel.BPP8, FimBitsPerPixel.BPP16, FimBitsPerPixel.BPP32].forEach(bpp => {
          [FimGLTextureFlags.None, FimGLTextureFlags.LinearSampling, FimGLTextureFlags.InputOnly,
              FimGLTextureFlags.LinearSampling | FimGLTextureFlags.InputOnly].forEach(flags => {
            const options: FimGLTextureOptions = {
              channels,
              bpp,
              textureFlags: flags | FimGLTextureFlags.InputOnly
            };

            using(gl.createTexture(240, 240, options), texture => {
              // Copy the 2D grey canvas to the texture
              texture.copyFrom(canvas);

              // Clear the WebGL canvas
              gl.fillCanvas('#000');

              // Render the texture to the WebGL canvas
              program.setInputs(texture);
              program.execute();

              // The WebGL canvas should now be grey
              expect(gl.getPixel(120, 120)).toEqual(FimColor.fromString('#888'));
            });
          });
        });
      });
    });
  });

  it('Downscales oversized textures', async () => {
    await DisposableSet.usingAsync(async disposable => {
      const fim = disposable.addDisposable(new FimWeb());
      const gl = disposable.addDisposable(fim.createGLCanvas(480, 240));

      // Find a texture size bigger than the GPU can support and create a texture of that size
      const caps = fim.getGLCapabilities();
      const textureSize = caps.maxTextureSize + 1000;
      const texture = disposable.addDisposable(gl.createTexture(textureSize, textureSize / 8,
        {textureFlags: FimGLTextureFlags.AllowLargerThanCanvas}));
      expect(texture.realDimensions).toBeDefined();
      expect(texture.realDimensions.w).toBe(caps.maxTextureSize);
      expect(texture.realDimensions.h).toBe(caps.maxTextureSize / 8);
      expect(texture.downscaleRatio).toBe(caps.maxTextureSize / textureSize);

      // Create a test image bigger than the GPU can support and load it onto the texture
      const jpeg = FimTestImages.fourSquaresJpeg();
      const buffer = disposable.addDisposable(await fim.createCanvasFromJpegAsync(jpeg));
      const srcImage = disposable.addDisposable(fim.createCanvas(textureSize, textureSize / 8));
      srcImage.copyFrom(buffer);
      texture.copyFrom(srcImage);

      // Render the texture to the WebGL canvas
      const program = disposable.addDisposable(new FimGLProgramCopy(gl));
      program.setInputs(texture);
      program.execute();

      // Check a few pixels to ensure the texture rendered correctly
      expectToBeCloseTo(gl.getPixel(120, 60), FimColor.fromString('#f00'));
      expectToBeCloseTo(gl.getPixel(360, 60), FimColor.fromString('#0f0'));
      expectToBeCloseTo(gl.getPixel(120, 180), FimColor.fromString('#00f'));
      expectToBeCloseTo(gl.getPixel(360, 180), FimColor.fromString('#000'));
    });
  });

  it('Automatically downscales to canvas size', () => {
    DisposableSet.using(async disposable => {
      const fim = disposable.addDisposable(new FimWeb());
      const gl = disposable.addDisposable(fim.createGLCanvas(480, 240));
      const texture = disposable.addDisposable(gl.createTexture(1024, 1024));

      // The texture should be automatically downscaled to fit on the canvas
      expect(texture.realDimensions.w).toBe(240);
      expect(texture.realDimensions.h).toBe(240);
    });
  });

  it('Fills with solid colors (OffScreenCanvas=false)', () => {
    DisposableSet.using(async disposable => {
      const fim = disposable.addDisposable(new FimWeb(FimDomCanvasFactory));
      const gl = disposable.addDisposable(fim.createGLCanvas(200, 200));
      const texture = disposable.addDisposable(gl.createTexture());
      const program = disposable.addDisposable(new FimGLProgramCopy(gl));

      // Fill with red
      texture.fillTexture('#f00');
      program.setInputs(texture);
      program.execute();
      expect(gl.getPixel(100, 100)).toEqual(FimColor.fromString('#f00'));

      // Fill with blue
      texture.fillTexture('#00f');
      program.setInputs(texture);
      program.execute();
      expect(gl.getPixel(100, 100)).toEqual(FimColor.fromString('#00f'));
    });
  });

  if (FimWeb.supportsOffscreenCanvas) {
    it('Fills with solid colors (OffScreenCanvas=true)', () => {
      DisposableSet.using(async disposable => {
        const fim = disposable.addDisposable(new FimWeb(FimOffscreenCanvasFactory));
        const gl = disposable.addDisposable(fim.createGLCanvas(200, 200));
        const texture = disposable.addDisposable(gl.createTexture());
        const program = disposable.addDisposable(new FimGLProgramCopy(gl));

        // Fill with red
        texture.fillTexture('#f00');
        program.setInputs(texture);
        program.execute();
        expect(gl.getPixel(100, 100)).toEqual(FimColor.fromString('#f00'));

        // Fill with blue
        texture.fillTexture('#00f');
        program.setInputs(texture);
        program.execute();
        expect(gl.getPixel(100, 100)).toEqual(FimColor.fromString('#00f'));
      });
    });
  }
});
