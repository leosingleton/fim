// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimGLProgramCopy } from '../FimGLProgramCopy';
import { FimGLTextureFlags } from '../../FimGLTexture';
import { FimWeb } from '../../../Fim';
import { FimColor } from '../../../primitives/FimColor';
import { DisposableSet } from '@leosingleton/commonlibs';

describe('FimGLProgramCopy', () => {

  it('Copies canvas to texture to WebGL canvas', () => {
    DisposableSet.using(disposable => {
      // Initialize the WebGL canvas, program, and a solid green texture from canvas
      const fim = disposable.addDisposable(new FimWeb());
      const canvas = disposable.addDisposable(fim.createGLCanvas(640, 480));
      const program = disposable.addDisposable(new FimGLProgramCopy(canvas));
      const orig = disposable.addDisposable(fim.createCanvas(640, 480, '#1f2'));
      const texture = disposable.addDisposable(canvas.createTextureFrom(orig));

      // Copy the texture
      program.setInputs(texture);
      program.execute();

      // Ensure the output WebGL canvas is now green
      expect(canvas.getPixel(100, 100)).toEqual(FimColor.fromString('#1f2'));
    });
  });

  it('Copies RGBA buffer to texture to WebGL canvas', () => {
    DisposableSet.using(disposable => {
      // Initialize the WebGL canvas, program, and a solid red texture from RGBA buffer
      const fim = disposable.addDisposable(new FimWeb());
      const canvas = disposable.addDisposable(fim.createGLCanvas(640, 480));
      const program = disposable.addDisposable(new FimGLProgramCopy(canvas));
      const buffer = disposable.addDisposable(fim.createRgbaBuffer(640, 480, '#f31'));
      const texture = disposable.addDisposable(canvas.createTextureFrom(buffer));

      // Copy the texture
      program.setInputs(texture);
      program.execute();

      // Ensure the output WebGL canvas is now red
      expect(canvas.getPixel(100, 100)).toEqual(FimColor.fromString('#f31'));

      // For additional test coverage, copy the output to an RGBA buffer and ensure it is also red
      const out = disposable.addDisposable(fim.createRgbaBuffer(640, 480));
      out.copyFrom(canvas);
      expect(canvas.getPixel(200, 300)).toEqual(FimColor.fromString('#f31'));
    });
  });

  it('Copies greyscale buffer to texture to WebGL canvas', () => {
    DisposableSet.using(disposable => {
      // Initialize the WebGL canvas, program, and a solid grey texture from RGBA buffer
      const fim = disposable.addDisposable(new FimWeb());
      const canvas = disposable.addDisposable(fim.createGLCanvas(640, 480));
      const program = disposable.addDisposable(new FimGLProgramCopy(canvas));
      const buffer = disposable.addDisposable(fim.createGreyscaleBuffer(640, 480, 128));
      const texture = disposable.addDisposable(canvas.createTextureFrom(buffer));

      // Copy the texture
      program.setInputs(texture);
      program.execute();

      // Ensure the output WebGL canvas is now grey
      expect(canvas.getPixel(100, 100)).toEqual(FimColor.fromString('#808080'));
    });
  });

  it('Copies from a texture to another texture when linear sampling is enabled', () => {
    DisposableSet.using(disposable => {
      // Initialize the WebGL canvas, program, and a solid grey texture from RGBA buffer
      const fim = disposable.addDisposable(new FimWeb());
      const canvas = disposable.addDisposable(fim.createGLCanvas(640, 480));
      const program = disposable.addDisposable(new FimGLProgramCopy(canvas));
      const buffer = disposable.addDisposable(fim.createGreyscaleBuffer(640, 480, 128));
      const t1 = disposable.addDisposable(canvas.createTextureFrom(buffer, FimGLTextureFlags.LinearSampling));
      const t2 = disposable.addDisposable(canvas.createTexture(640, 480,
        { textureFlags: FimGLTextureFlags.LinearSampling }));

      // Copy t1 to t2
      program.setInputs(t1);
      program.execute(t2);

      // Copy t2 to output
      program.setInputs(t2);
      program.execute();

      // Ensure the output WebGL canvas is now grey
      expect(canvas.getPixel(100, 100)).toEqual(FimColor.fromString('#808080'));
    });
  });

});
