// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { RenderingContext2D } from './types/RenderingContext2D';
import { FimDimensions } from '../../../primitives/FimDimensions';
import { FimError, FimErrorCode } from '../../../primitives/FimError';
import { makeDisposable, IDisposable } from '@leosingleton/commonlibs';

/** Wrapper around the HTML canvas and canvas-like objects */
export abstract class CoreCanvas {
  /**
   * Derived classes must override this constructor to instantiate the canvasElement object
   * @param canvasDimensions Canvas dimensions
   */
  protected constructor(canvasDimensions: FimDimensions) {
    this.canvasDimensions = canvasDimensions;
  }

  /** Canvas dimensions */
  public readonly canvasDimensions: FimDimensions;

  /** Derived classes must override this method to dispose the canvas */
  public abstract dispose(): void;

  /**
   * Helper function to construct a drawing context
   * @param destCanvas HTML or offscreen canvas to create drawing context of
   * @param imageSmoothingEnabled Enables image smoothing
   * @param operation CanvasRenderingContext2D.globalCompositeOperation value, e.g. 'copy' or 'source-over'
   * @param alpha CanvasRenderingContext2D.alpha value, where 0 = transparent and 1 = opaque
   */
  public createDrawingContext(imageSmoothingEnabled = false, operation = 'copy', alpha = 1):
      RenderingContext2D & IDisposable {
    const ctx = this.getContext2D();
    if (!ctx) {
      // Safari on iOS has a limit of 288 MB total for all canvases on a page. It logs this message to the console if
      // connecting to a PC for debugging, but the only errror given to the JavaScript code is returning a null on
      // getContext('2d'). This is most likely the cause of null here.
      throw new FimError(FimErrorCode.OutOfMemory);
    }

    ctx.save();
    ctx.globalCompositeOperation = operation;
    ctx.globalAlpha = alpha;

    // Disable image smoothing in most common browsers. Still an experimental feature, so TypeScript doesn't seem to
    // support it well...
    // @nomangle imageSmoothingEnabled mozImageSmoothingEnabled webkitImageSmoothingEnabled msImageSmoothingEnabled
    const ctxAny = ctx as any;
    ctxAny['imageSmoothingEnabled'] = imageSmoothingEnabled;
    ctxAny['mozImageSmoothingEnabled'] = imageSmoothingEnabled;
    ctxAny['webkitImageSmoothingEnabled'] = imageSmoothingEnabled;
    ctxAny['msImageSmoothingEnabled'] = imageSmoothingEnabled;

    return makeDisposable(ctx, ctx => ctx.restore());
  }

  /** Derived classes must override this method to call canvas.getContext('2d') */
  protected abstract getContext2D(): RenderingContext2D;
}
