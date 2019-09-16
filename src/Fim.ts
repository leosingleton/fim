// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimCanvas, IFimCanvas, _FimCanvas } from './image/FimCanvas';
import { FimColor } from './primitives/FimColor';
import { IDisposable } from '@leosingleton/commonlibs';

/** Factory methods for creating canvases */
export interface IFim extends IDisposable {
  /**
   * Creates a 2D canvas
   * @param width Canvas width, in pixels
   * @param height Canvas height, in pixels
   * @param initialColor If specified, the canvas is initalized to this color.
   */
  createCanvas(width: number, height: number, initialColor?: FimColor | string): IFimCanvas;
}

/** Implementation of canvas factory for web browsers */
export class Fim implements IFim {
  /**
   * Creates a 2D canvas
   * @param width Canvas width, in pixels
   * @param height Canvas height, in pixels
   * @param initialColor If specified, the canvas is initalized to this color.
   */
  public createCanvas(width: number, height: number, initialColor?: FimColor | string): FimCanvas {
    return new _FimCanvas(this, width, height, initialColor);
  }

  public dispose() {}
}
