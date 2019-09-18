// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimConfig } from './debug/FimConfig';
import { IFimGLCapabilities, _getGLCapabilities } from './gl/FimGLCapabilities';
import { FimGLCanvas, _FimGLCanvas } from './gl/FimGLCanvas';
import { FimCanvas, _FimCanvas } from './image/FimCanvas';
import { FimCanvasFactory, FimDomCanvasFactory, FimOffscreenCanvasFactory } from './image/FimCanvasFactory';
import { FimGreyscaleBuffer, _FimGreyscaleBuffer } from './image/FimGreyscaleBuffer';
import { FimRgbaBuffer, _FimRgbaBuffer } from './image/FimRgbaBuffer';
import { FimColor } from './primitives/FimColor';
import { IDisposable } from '@leosingleton/commonlibs';

/** Factory methods for creating canvases */
export abstract class Fim implements IDisposable {
  protected constructor(canvasFactory: FimCanvasFactory) {
    this.canvasFactory = canvasFactory;
  }

  /** A factory method used to create invisible canvases */
  public readonly canvasFactory: FimCanvasFactory;

  /**
   * Creates an image consisting of 8-bit greyscale pixel data in a Uint8Array
   * @param width Canvas width, in pixels
   * @param height Canvas height, in pixels
   * @param initialColor If specified, the canvas is initalized to this value (0 to 255).
   */
  public createGreyscaleBuffer(width: number, height: number, initialColor?: number): FimGreyscaleBuffer {
    return new _FimGreyscaleBuffer(this, width, height, initialColor);
  }

  /**
   * Creates an image consisting of 8-bit RGBA pixel data in a Uint8Array
   * @param width Canvas width, in pixels
   * @param height Canvas height, in pixels
   * @param initialColor If specified, the canvas is initalized to this color.
   */
  public createRgbaBuffer(width: number, height: number, initialColor?: FimColor | string): FimRgbaBuffer {
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

  /**
   * Creates a 2D canvas from a JPEG file
   * @param jpegFile JPEG file, loaded into a byte array
   */
  public createCanvasFromJpegAsync(jpegFile: Uint8Array): Promise<FimCanvas> {
    return _FimCanvas.createFromJpegAsync(this, jpegFile);
  }

  /**
   * Creates a WebGL canvas
   * @param width Width, in pixels
   * @param height Height, in pixels
   * @param initialColor If specified, the canvas is initalized to this color
   * @param quality A 0 to 1 value controlling the quality of rendering. Lower values can be used to improve
   *    performance.
   */
  public createGLCanvas(width: number, height: number, initialColor?: FimColor | string, quality = 1): FimGLCanvas {
    return new _FimGLCanvas(this, width, height, initialColor, quality);
  }

  /** Returns the WebGL capabilities of the current browser */
  public getGLCapabilities(): IFimGLCapabilities {
    return _getGLCapabilities(this);
  }

  public dispose() {}
}

/** Implementation of canvas factory for web browsers */
export class FimWeb extends Fim {
  /**
   * Constructor
   * @param canvasFactory If provided, this function is used to instantiate an OffscreenCanvas object. If unspecified,
   *    we check the browser's capabilities, and use Chrome's OffscreenCanvas functionality if supported, otherwise we
   *    create a canvas on the DOM.
   */
  public constructor(canvasFactory: FimCanvasFactory = FimWeb.supportsOffscreenCanvas ? FimOffscreenCanvasFactory :
      FimDomCanvasFactory) {
    // We have an option to disable offscreen canvas support via the query string. This can be useful for debugging,
    // since regular canvases can be made visible in the browser's debugging tools.
    let enableOC = FimConfig.config.enableOffscreenCanvas;
    if (!enableOC && canvasFactory === FimOffscreenCanvasFactory) {
      canvasFactory = FimDomCanvasFactory;
    }

    super(canvasFactory);
  }

  /** Determines whether the current browser supports offscreen canvases */
  public static readonly supportsOffscreenCanvas = (typeof OffscreenCanvas !== 'undefined');

  /**
   * Creates a 2D canvas from a Blob containing an image
   * @param blob Blob of type 'image/*'
   */
  public createFromImageBlobAsync(blob: Blob): Promise<FimCanvas> {
    return _FimCanvas.createFromImageBlobAsync(this, blob);
  }
}
