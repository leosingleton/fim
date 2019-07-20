// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimGLCanvas } from '../FimGLCanvas';
import { FimGLTexture } from '../FimGLTexture';
import { FimGLProgramCopy } from '../programs';
import { FimCanvas } from '../../image';
import { FimColor } from '../../primitives';
import { FimTestImages } from '../../test';
import { DisposableSet } from '@leosingleton/commonlibs';

function expectToBeCloseTo(actual: FimColor, expected: FimColor): void {
  expect(actual.r).toBeCloseTo(expected.r, -1);
  expect(actual.g).toBeCloseTo(expected.g, -1);
  expect(actual.b).toBeCloseTo(expected.b, -1);  
  expect(actual.a).toBeCloseTo(expected.a, -1);  
}

describe('FimGLTexture', () => {
  it('Downscales oversized textures', () => {
    DisposableSet.usingAsync(async disposable => {
      let gl = disposable.addDisposable(new FimGLCanvas(480, 480));
      
      // Find a texture size bigger than the GPU can support and create a texture of that size
      let textureSize = gl.capabilities.maxTextureSize + 1000;
      let texture = disposable.addDisposable(new FimGLTexture(gl, textureSize, textureSize));
      expect(texture.downscaled).toBeTruthy();
      expect(texture.w).toBe(gl.capabilities.maxTextureSize);
      expect(texture.h).toBe(gl.capabilities.maxTextureSize);
      expect(texture.originalDimensions.w).toBe(textureSize);
      expect(texture.originalDimensions.h).toBe(textureSize);

      // Create a test image bigger than the GPU can support and load it onto the texture
      let jpeg = FimTestImages.fourSquaresJpeg();
      let buffer = disposable.addDisposable(await FimCanvas.createFromJpeg(jpeg));
      let srcImage = disposable.addDisposable(new FimCanvas(textureSize + 200, textureSize + 200));
      srcImage.copyFrom(buffer);

      // Render the texture to the WebGL canvas
      let program = disposable.addDisposable(new FimGLProgramCopy(gl));
      program.setInputs(texture);
      program.execute();

      // Check a few pixels to ensure the texture rendered correctly
      expectToBeCloseTo(gl.getPixel(120, 120), FimColor.fromString('#f00'));
      expectToBeCloseTo(gl.getPixel(360, 120), FimColor.fromString('#0f0'));
      expectToBeCloseTo(gl.getPixel(120, 360), FimColor.fromString('#00f'));
      expectToBeCloseTo(gl.getPixel(360, 360), FimColor.fromString('#000'));
    });
  });
});
