// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimGLProgramFill } from '../FimGLProgramFill';
import { FimGLCanvas } from '../../FimGLCanvas';
import { Fim } from '../../../Fim';
import { FimColor } from '../../../primitives/FimColor';
import { FimRect } from '../../../primitives/FimRect';
import { DisposableSet } from '@leosingleton/commonlibs';
import { FimOffscreenCanvasFactory, FimDefaultOffscreenCanvasFactory } from '../../../image/FimCanvasBase';

function spec(offscreenCanvasFactory: FimOffscreenCanvasFactory) {
  return () => {
    it('Respects custom destination rectangles', () => {
      DisposableSet.using(disposable => {
        // Create a 300x200 red canvas
        let fim = disposable.addDisposable(new Fim());
        let gl = disposable.addDisposable(new FimGLCanvas(fim, 300, 200, '#f00', offscreenCanvasFactory));

        // Draw a 100x100 blue square using the fill program and a custom destination rectangle
        let fill = disposable.addDisposable(new FimGLProgramFill(gl));
        fill.setInputs(FimColor.fromString('#00f'));
        fill.execute(null, FimRect.fromXYWidthHeight(100, 50, 100, 100));

        // Ensure the pixels are the expected colors
        expect(gl.getPixel(50, 100)).toEqual(FimColor.fromString('#f00'));
        expect(gl.getPixel(150, 100)).toEqual(FimColor.fromString('#00f'));
        expect(gl.getPixel(250, 100)).toEqual(FimColor.fromString('#f00'));
      });
    });

    it('Respects custom destination rectangles vertically', () => {
      DisposableSet.using(disposable => {
        // Create a 100x200 red canvas
        let fim = disposable.addDisposable(new Fim());
        let gl = disposable.addDisposable(new FimGLCanvas(fim, 100, 200, '#f00', offscreenCanvasFactory));

        // Draw a 100x100 blue square using the fill program and a custom destination rectangle
        let fill = disposable.addDisposable(new FimGLProgramFill(gl));
        fill.setInputs(FimColor.fromString('#00f'));
        fill.execute(null, FimRect.fromXYWidthHeight(0, 0, 100, 100));

        // Ensure the pixels are the expected colors
        expect(gl.getPixel(50, 50)).toEqual(FimColor.fromString('#00f'));
        expect(gl.getPixel(50, 150)).toEqual(FimColor.fromString('#f00'));
      });
    });

    it('Respects custom destination rectangles to the pixel', () => {
      DisposableSet.using(disposable => {
        // Create a 100x100 red canvas
        let fim = disposable.addDisposable(new Fim());
        let gl = disposable.addDisposable(new FimGLCanvas(fim, 100, 100, '#f00', offscreenCanvasFactory));

        // Draw a blue on one specific pixel
        let fill = disposable.addDisposable(new FimGLProgramFill(gl));
        fill.setInputs(FimColor.fromString('#00f'));
        fill.execute(null, FimRect.fromXYWidthHeight(25, 25, 1, 1));

        // Ensure the pixels are the expected colors
        expect(gl.getPixel(25, 25)).toEqual(FimColor.fromString('#00f'));
        expect(gl.getPixel(26, 26)).toEqual(FimColor.fromString('#f00'));
      });
    });
  };
}

describe('FimGLProgramFill(OffScreenCanvas=false)', spec(null));

// Only run OffscreenCanvas tests on browsers that support it
if (FimGLCanvas.supportsOffscreenCanvas) {
  describe('FimGLProgramFill(OffScreenCanvas=true)', spec(FimDefaultOffscreenCanvasFactory));
}
