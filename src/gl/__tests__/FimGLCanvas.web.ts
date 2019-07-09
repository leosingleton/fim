// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimGLCanvas } from '../FimGLCanvas';
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

describe('FimGLCanvas', () => {

  it('Creates and disposes', () => {
    let b = new FimGLCanvas(640, 480);
    expect(b.getCanvas()).toBeDefined();

    b.dispose();
    expect(b.getCanvas()).toBeUndefined();

    // Double-dispose
    b.dispose();
    expect(b.getCanvas()).toBeUndefined();
  });

  it('Fills with a solid color', () => {
    using(new FimGLCanvas(640, 480), c => {
      c.fill('#f00');
      expectToBeCloseTo(c.getPixel(300, 200), FimColor.fromString('#f00'));
    });
  });

  it('Renders a JPEG texture', async () => {
    DisposableSet.usingAsync(async disposable => {
      // Initialize the WebGL canvas, program, and a texture loaded from a JPEG image
      let canvas = disposable.addDisposable(new FimGLCanvas(128, 128));
      let program = disposable.addDisposable(new FimGLProgramCopy(canvas));
      let jpeg = FimTestImages.fourSquaresJpeg();
      let buffer = disposable.addDisposable(await FimCanvas.createFromJpeg(jpeg));
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

});
