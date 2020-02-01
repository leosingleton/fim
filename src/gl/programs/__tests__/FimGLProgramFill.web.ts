// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimGLProgramFill } from '../FimGLProgramFill';
import { FimWeb } from '../../../Fim';
import { FimCanvasFactory, FimDomCanvasFactory, FimOffscreenCanvasFactory } from '../../../image/FimCanvasFactory';
import { FimColor } from '../../../primitives/FimColor';
import { FimRect } from '../../../primitives/FimRect';
import { DisposableSet } from '@leosingleton/commonlibs';

function spec(canvasFactory: FimCanvasFactory) {
  return () => {
    it('Respects custom destination rectangles', () => {
      DisposableSet.using(disposable => {
        // Create a 300x200 red canvas
        const fim = disposable.addDisposable(new FimWeb(canvasFactory));
        const gl = disposable.addDisposable(fim.createGLCanvas(300, 200, '#f00'));

        // Draw a 100x100 blue square using the fill program and a custom destination rectangle
        const fill = disposable.addDisposable(new FimGLProgramFill(gl));
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
        const fim = disposable.addDisposable(new FimWeb(canvasFactory));
        const gl = disposable.addDisposable(fim.createGLCanvas(100, 200, '#f00'));

        // Draw a 100x100 blue square using the fill program and a custom destination rectangle
        const fill = disposable.addDisposable(new FimGLProgramFill(gl));
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
        const fim = disposable.addDisposable(new FimWeb(canvasFactory));
        const gl = disposable.addDisposable(fim.createGLCanvas(100, 100, '#f00'));

        // Draw a blue on one specific pixel
        const fill = disposable.addDisposable(new FimGLProgramFill(gl));
        fill.setInputs(FimColor.fromString('#00f'));
        fill.execute(null, FimRect.fromXYWidthHeight(25, 25, 1, 1));

        // Ensure the pixels are the expected colors
        expect(gl.getPixel(25, 25)).toEqual(FimColor.fromString('#00f'));
        expect(gl.getPixel(26, 26)).toEqual(FimColor.fromString('#f00'));
      });
    });
  };
}

describe('FimGLProgramFill(OffScreenCanvas=false)', spec(FimDomCanvasFactory));

// Only run OffscreenCanvas tests on browsers that support it
if (FimWeb.supportsOffscreenCanvas) {
  describe('FimGLProgramFill(OffScreenCanvas=true)', spec(FimOffscreenCanvasFactory));
}
