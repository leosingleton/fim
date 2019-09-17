// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimConfig } from './debug/FimConfig';
import { FimCanvas, IFimCanvas, _FimCanvas } from './image/FimCanvas';
import { FimCanvasFactory, FimDomCanvasFactory, FimOffscreenCanvasFactory } from './image/FimCanvasFactory';
import { IFimGreyscaleBuffer, _FimGreyscaleBuffer } from './image/FimGreyscaleBuffer';
import { IFimRgbaBuffer, _FimRgbaBuffer } from './image/FimRgbaBuffer';
import { FimColor } from './primitives/FimColor';
import { IDisposable } from '@leosingleton/commonlibs';

/** Factory methods for creating canvases */
export interface IFim extends IDisposable {
  /**
   * Creates an image consisting of 8-bit greyscale pixel data in a Uint8Array
   * @param width Canvas width, in pixels
   * @param height Canvas height, in pixels
   * @param initialColor If specified, the canvas is initalized to this value (0 to 255).
   */
  createGreyscaleBuffer(width: number, height: number, initialColor?: number): IFimGreyscaleBuffer;

  /**
   * Creates an image consisting of 8-bit RGBA pixel data in a Uint8Array
   * @param width Canvas width, in pixels
   * @param height Canvas height, in pixels
   * @param initialColor If specified, the canvas is initalized to this color.
   */
  createRgbaBuffer(width: number, height: number, initialColor?: FimColor | string): IFimRgbaBuffer;

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
   * Constructor
   * @param canvasFactory If provided, this function is used to instantiate an OffscreenCanvas object. If unspecified,
   *    we check the browser's capabilities, and use Chrome's OffscreenCanvas functionality if supported, otherwise we
   *    create a canvas on the DOM.
   */
  public constructor(canvasFactory = Fim.supportsOffscreenCanvas ? FimOffscreenCanvasFactory : FimDomCanvasFactory) {
    // We have an option to disable offscreen canvas support via the query string. This can be useful for debugging,
    // since regular canvases can be made visible in the browser's debugging tools.
    let enableOC = FimConfig.config.enableOffscreenCanvas;
    if (!enableOC && canvasFactory === FimOffscreenCanvasFactory) {
      canvasFactory = FimDomCanvasFactory;
    }

    this.canvasFactory = canvasFactory;
  }

  /** Determines whether the current browser supports offscreen canvases */
  public static readonly supportsOffscreenCanvas = (typeof OffscreenCanvas !== 'undefined');

  /** If offscreenCanvas is true, a reference to the factory object used to create the canvas */
  public readonly canvasFactory: FimCanvasFactory;

  /**
   * Creates an image consisting of 8-bit greyscale pixel data in a Uint8Array
   * @param width Canvas width, in pixels
   * @param height Canvas height, in pixels
   * @param initialColor If specified, the canvas is initalized to this value (0 to 255).
   */
  public createGreyscaleBuffer(width: number, height: number, initialColor?: number): IFimGreyscaleBuffer {
    return new _FimGreyscaleBuffer(this, width, height, initialColor);
  }

  /**
   * Creates an image consisting of 8-bit RGBA pixel data in a Uint8Array
   * @param width Canvas width, in pixels
   * @param height Canvas height, in pixels
   * @param initialColor If specified, the canvas is initalized to this color.
   */
  public createRgbaBuffer(width: number, height: number, initialColor?: FimColor | string): IFimRgbaBuffer {
    return new _FimRgbaBuffer(this, width, height, initialColor);
  }

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
