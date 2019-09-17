// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimGLProgramMatrixOperation1DFast } from '../FimGLProgramMatrixOperation1DFast';
import { FimGLTextureFlags } from '../../FimGLTexture';
import { Fim } from '../../../Fim';
import { GaussianKernel } from '../../../math/GaussianKernel';
import { FimColor } from '../../../primitives/FimColor';
import { DisposableSet } from '@leosingleton/commonlibs';

describe('FimGLProgramMatrixOperation1DFast', () => {

  it('Blurs a solid colored canvas', () => {
    DisposableSet.using(disposable => {
      // Build a Gaussian blur kernel
      let kernel = GaussianKernel.calculate(5, 17);

      // Initialize the WebGL canvas, program, and a solid blue texture from canvas
      let fim = disposable.addDisposable(new Fim());
      let canvas = disposable.addDisposable(fim.createGLCanvas(640, 480));
      let program = disposable.addDisposable(new FimGLProgramMatrixOperation1DFast(canvas, kernel.length));
      let orig = disposable.addDisposable(fim.createCanvas(640, 480, '#21f'));
      let texture = disposable.addDisposable(canvas.createTextureFrom(orig, FimGLTextureFlags.LinearSampling));

      // Blur the texture
      program.setInputs(texture, kernel);
      program.execute();

      // Ensure the output is still solid green--blurring shouldn't change the color
      expect(canvas.getPixel(100, 100)).toEqual(FimColor.fromString('#21f'));
    });
  });

});
