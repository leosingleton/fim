// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimGLCanvas } from '../FimGLCanvas';
import { FimGLCapabilities } from '../FimGLCapabilities';
import { FimGLTexture, FimGLTextureFlags, FimGLTextureOptions } from '../FimGLTexture';
import { FimGLProgramCopy } from '../programs';
import { FimCanvas } from '../../image';
import { FimBitsPerPixel, FimColor, FimColorChannels } from '../../primitives';
import { FimTestImages } from '../../test';
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
      let gl = disposable.addDisposable(new FimGLCanvas(240, 240));
      let program = disposable.addDisposable(new FimGLProgramCopy(gl));
      let canvas = disposable.addDisposable(new FimCanvas(240, 240, '#888'));

      [FimColorChannels.Greyscale, FimColorChannels.RGB, FimColorChannels.RGBA].forEach(channels => {
        [FimBitsPerPixel.BPP8, FimBitsPerPixel.BPP16, FimBitsPerPixel.BPP32].forEach(bpp => {
          [FimGLTextureFlags.None, FimGLTextureFlags.LinearSampling, FimGLTextureFlags.InputOnly,
              FimGLTextureFlags.LinearSampling | FimGLTextureFlags.InputOnly].forEach(flags => {
            let options: FimGLTextureOptions = {
              channels: channels,
              bpp: bpp,
              flags: flags | FimGLTextureFlags.InputOnly
            };

            using(new FimGLTexture(gl, 240, 240, options), texture => {
              // Copy the 2D grey canvas to the texture
              texture.copyFrom(canvas);
    
              // Clear the WebGL canvas
              gl.fill('#000');
    
              // Render the texture to the WebGL canvas
              program.setInputs(texture);
              program.execute();
    
              // The WebGL canvas should now be grey
              expect(gl.getPixel(120, 120)).toEqual(FimColor.fromString('#888'));
            });
          });
        })
      });
    });
  });

  it('Downscales oversized textures', async () => {
    await DisposableSet.usingAsync(async disposable => {
      let gl = disposable.addDisposable(new FimGLCanvas(480, 240));
      
      // Find a texture size bigger than the GPU can support and create a texture of that size
      let caps = FimGLCapabilities.getCapabilities();
      let textureSize = caps.maxTextureSize + 1000;
      let texture = disposable.addDisposable(new FimGLTexture(gl, textureSize, textureSize / 8,
        {flags: FimGLTextureFlags.AllowLargerThanCanvas}));
      expect(texture.realDimensions).toBeDefined();
      expect(texture.realDimensions.w).toBe(caps.maxTextureSize);
      expect(texture.realDimensions.h).toBe(caps.maxTextureSize / 8);
      expect(texture.downscaleRatio).toBe(textureSize / caps.maxTextureSize);

      // Create a test image bigger than the GPU can support and load it onto the texture
      let jpeg = FimTestImages.fourSquaresJpeg();
      let buffer = disposable.addDisposable(await FimCanvas.createFromJpeg(jpeg));
      let srcImage = disposable.addDisposable(new FimCanvas(textureSize, textureSize / 8));
      srcImage.copyFrom(buffer);
      texture.copyFrom(srcImage);

      // Render the texture to the WebGL canvas
      let program = disposable.addDisposable(new FimGLProgramCopy(gl));
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
      let gl = disposable.addDisposable(new FimGLCanvas(480, 240));
      let texture = disposable.addDisposable(new FimGLTexture(gl, 1024, 1024));

      // The texture should be automatically downscaled to fit on the canvas
      expect(texture.realDimensions.w).toBe(240);
      expect(texture.realDimensions.h).toBe(240);
    });
  });
});
