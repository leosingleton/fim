// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimGLProgramCopy } from '../FimGLProgramCopy';
import { FimGLCanvas } from '../../FimGLCanvas';
import { FimGLTexture } from '../../FimGLTexture';
import { FimCanvas, FimGreyscaleBuffer, FimRgbaBuffer } from '../../../image';
import { FimColor } from '../../../primitives';
import { DisposableSet } from '@leosingleton/commonlibs';

describe('FimGLProgramCopy', () => {

  it('Copies canvas to texture to WebGL canvas', () => {
    DisposableSet.using(disposable => {
      // Initialize the WebGL canvas, program, and a solid blue texture from canvas
      let canvas = disposable.addDisposable(new FimGLCanvas(640, 480));
      let program = disposable.addDisposable(new FimGLProgramCopy(canvas));
      let orig = disposable.addDisposable(new FimCanvas(640, 480, '#1f2'));
      let texture = disposable.addDisposable(FimGLTexture.createFromCanvas(canvas, orig));

      // Copy the texture
      program.setInputs(texture);
      program.execute();

      // Ensure the output WebGL canvas is now blue
      expect(canvas.getPixel(100, 100)).toEqual(FimColor.fromString('#1f2'));
    });
  });

  it('Copies RGBA buffer to texture to WebGL canvas', () => {
    DisposableSet.using(disposable => {
      // Initialize the WebGL canvas, program, and a solid red texture from RGBA buffer
      let canvas = disposable.addDisposable(new FimGLCanvas(640, 480));
      let program = disposable.addDisposable(new FimGLProgramCopy(canvas));
      let buffer = disposable.addDisposable(new FimRgbaBuffer(640, 480, '#f31'));
      let texture = disposable.addDisposable(FimGLTexture.createFromRgbaBuffer(canvas, buffer));

      // Copy the texture
      program.setInputs(texture);
      program.execute();

      // Ensure the output WebGL canvas is now red
      expect(canvas.getPixel(100, 100)).toEqual(FimColor.fromString('#f31'));

      // For additional test coverage, copy the output to an RGBA buffer and ensure it is also red
      let out = disposable.addDisposable(new FimRgbaBuffer(640, 480));
      out.copyFromCanvas(canvas);
      expect(canvas.getPixel(200, 300)).toEqual(FimColor.fromString('#f31'));
    });
  });

  it('Copies greyscale buffer to texture to WebGL canvas', () => {
    DisposableSet.using(disposable => {
      // Initialize the WebGL canvas, program, and a solid grey texture from RGBA buffer
      let canvas = disposable.addDisposable(new FimGLCanvas(640, 480));
      let program = disposable.addDisposable(new FimGLProgramCopy(canvas));
      let buffer = disposable.addDisposable(new FimGreyscaleBuffer(640, 480, 128));
      let texture = disposable.addDisposable(FimGLTexture.createFromGreyscaleBuffer(canvas, buffer));

      // Copy the texture
      program.setInputs(texture);
      program.execute();

      // Ensure the output WebGL canvas is now grey
      expect(canvas.getPixel(100, 100)).toEqual(FimColor.fromString('#808080'));
    });
  });

});
