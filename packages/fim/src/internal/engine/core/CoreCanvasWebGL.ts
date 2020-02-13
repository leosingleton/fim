// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { CoreCanvas } from './CoreCanvas';
import { RenderingContextWebGL } from './types/RenderingContextWebGL';
import { FimColor } from '../../../primitives/FimColor';
import { FimPoint } from '../../../primitives/FimPoint';

/** Wrapper around the HTML canvas and canvas-like objects */
export abstract class CoreCanvasWebGL extends CoreCanvas {
  /** Derived classes must override this method to call canvas.getContext('webgl') */
  protected abstract getContext(): RenderingContextWebGL;

  public fillCanvas(color: FimColor | string): void {
    const c = (color instanceof FimColor) ? color : FimColor.fromString(color);
    const gl = this.getContext();

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    //FimGLError.throwOnError(gl);
    gl.viewport(0, 0, this.canvasDimensions.w, this.canvasDimensions.h);
    //FimGLError.throwOnError(gl);
    gl.disable(gl.SCISSOR_TEST);
    //FimGLError.throwOnError(gl);
    gl.clearColor(c.r / 255, c.g / 255, c.b / 255, c.a / 255);
    //FimGLError.throwOnError(gl);
    gl.clear(gl.COLOR_BUFFER_BIT);
    //FimGLError.throwOnError(gl);
  }

  public getPixel(x: number, y: number): FimColor {
    const gl = this.getContext();
    const pixel = new Uint8Array(4);

    // Scale the coordinates and flip Y, as the coordinates for readPixels start in the lower-left corner
    const point = FimPoint.fromXY(x, this.canvasDimensions.h - y - 1).toFloor();
    this.validateCoordinates(point);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    //FimGLError.throwOnError(gl);
    gl.readPixels(point.x, point.y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
    //FimGLError.throwOnError(gl);

    return FimColor.fromRGBABytes(pixel[0], pixel[1], pixel[2], pixel[3]);
  }
}
