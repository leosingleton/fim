import { IDisposable } from '@leosingleton/commonlibs';

export class FimCanvasDrawingContext implements IDisposable {
  /**
   * Constructs a drawing context
   * @param canvas HTMLCanvasElement
   * @param operation CanvasRenderingContext2D.globalCompositeOperation value, e.g. 'copy' or 'source-over'
   * @param alpha CanvasRenderingContext2D.alpha value, where 0 = transparent and 1 = opaque
   * @param imageSmoothingEnabled Enables image smoothing
   */
  public constructor(canvas: HTMLCanvasElement, operation = 'copy', alpha = 1, imageSmoothingEnabled = false) {
    let ctx = canvas.getContext('2d');
    ctx.save();
    ctx.globalCompositeOperation = operation;
    ctx.globalAlpha = alpha;
    this.context = ctx;

    // Diable image smoothing in most common browsers. Still an experimental feature, so TypeScript doesn't seem to
    // support it well...
    // @nomangle imageSmoothingEnabled mozImageSmoothingEnabled webkitImageSmoothingEnabled msImageSmoothingEnabled
    let ctxAny = ctx as any;
    ctxAny.imageSmoothingEnabled = imageSmoothingEnabled;
    ctxAny.mozImageSmoothingEnabled = imageSmoothingEnabled;
    ctxAny.webkitImageSmoothingEnabled = imageSmoothingEnabled;
    ctxAny.msImageSmoothingEnabled = imageSmoothingEnabled;
  }

  /** The CanvasRenderingContext2D */
  public context: CanvasRenderingContext2D;

  public dispose(): void {
    if (this.context) {
      this.context.restore();
      delete this.context;
    }
  }
}
