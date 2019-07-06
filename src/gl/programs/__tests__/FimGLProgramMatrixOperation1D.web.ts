// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimGLProgramMatrixOperation1D } from '../FimGLProgramMatrixOperation1D';
import { FimGLCanvas } from '../../FimGLCanvas';
import { FimGLTexture } from '../../FimGLTexture';
import { FimCanvas } from '../../../image';
import { GaussianKernel } from '../../../math';
import { FimColor } from '../../../primitives';
import { DisposableSet } from '@leosingleton/commonlibs';

describe('FimGLProgramMatrixOperation1D', () => {

  it('Blurs a solid colored canvas', () => {
    DisposableSet.using(disposable => {
      // Build a Gaussian blur kernel
      let kernel = GaussianKernel.calculate(5, 17);

      // Initialize the WebGL canvas, program, and a solid blue texture from canvas
      let canvas = disposable.addDisposable(new FimGLCanvas(640, 480));
      let program = disposable.addDisposable(new FimGLProgramMatrixOperation1D(canvas, kernel.length));
      let orig = disposable.addDisposable(new FimCanvas(640, 480, '#21f'));
      let texture = disposable.addDisposable(FimGLTexture.createFromCanvas(canvas, orig));

      // Blur the texture
      program.setInputs(texture, kernel);
      program.execute();

      // Ensure the output is still solid green--blurring shouldn't change the color
      expect(canvas.getPixel(100, 100)).toEqual(FimColor.fromString('#21f'));
    });
  });

});