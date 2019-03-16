import { FimImage } from './FimImage';
import { FimImageType } from './FimImageType';
import { FimCanvasDrawingContext } from './FimCanvasDrawingContext';
import { FimColor, FimRect } from '../primitives';
import { using } from '@leosingleton/commonlibs';

/** An image consisting of an invisible HTML canvas on the DOM */
export class FimCanvas extends FimImage {
  /**
   * Creates an invisible canvas in the DOM
   * @param width Canvas width, in pixels
   * @param height Canvas height, in pixels
   * @param initialColor If specified, the canvas is initalized to this color.
   */
  public constructor(width: number, height: number, initialColor?: FimColor | string) {
    super(width, height);

    // Create a hidden canvas
    let canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.style.display = 'none';
    document.body.appendChild(canvas);
    this.canvasElement = canvas;

    if (initialColor) {
      this.fill(initialColor);
    }
  }

  /** Returns the underlying HTMLCanvasElement */
  public getCanvas(): HTMLCanvasElement {
    return this.canvasElement;
  }
  private canvasElement: HTMLCanvasElement;

  public readonly type = FimImageType.FimCanvas;

  public dispose(): void {
    if (this.canvasElement) {
      document.body.removeChild(this.canvasElement);
      delete this.canvasElement;
    }
  }

  /** Creates a new FimCanvas which is a duplicate of this one */
  public duplicate(): FimCanvas {
    let dupe = new FimCanvas(this.dimensions.w, this.dimensions.h);
    dupe.copyFrom(this, this.dimensions, this.dimensions);
    return dupe;
  }

  /**
   * Boilerplate code for performing a canvas compositing operation with two canvases. If input and output canvases
   * differ in size, the operation is scaled to fill the output canvas.
   */
  private opWithSrcDest(inputCanvas: FimCanvas, operation: string, alpha: number, src: FimRect, dest: FimRect,
      imageSmoothingEnabled = false): void {
    using(new FimCanvasDrawingContext(this.canvasElement, operation, alpha, imageSmoothingEnabled), ctx => {
      ctx.context.drawImage(inputCanvas.canvasElement, src.xLeft, src.yTop, src.w, src.h, dest.xLeft, dest.yTop,
        dest.w, dest.h);
    });
  }

  /** Boilerplate code for performing a canvas compositing operation with a solid color */
  private opWithColor(color: string, operation: string, alpha: number): void {
    using(new FimCanvasDrawingContext(this.canvasElement, operation, alpha), ctx => {
      ctx.context.fillStyle = color;
      ctx.context.fillRect(0, 0, this.dimensions.w, this.dimensions.h);  
    });
  }

  /** Fills the canvas with a solid color */
  public fill(color: FimColor | string): void {
    if (typeof(color) === 'string') {
      this.opWithColor(color, 'copy', 1);
    } else {
      this.opWithColor(color.string, 'copy', 1);
    }
  }

  protected copyFromInternal(srcImage: FimImage, srcCoords: FimRect, destCoords: FimRect): void {
    switch (srcImage.type) {
      case FimImageType.FimCanvas:
        this.copyFromFimCanvas(srcImage as FimCanvas, srcCoords, destCoords);
        break;

      default:
        throw new Error('Not supported: ' + srcImage.type);
    }
  }

  private copyFromFimCanvas(srcImage: FimCanvas, srcCoords: FimRect, destCoords: FimRect): void {
    let op = 'source-over';
    if (destCoords.equals(this.dimensions)) {
      // copy is slightly faster than source-over
      op = 'copy';
    }
    
    this.opWithSrcDest(srcImage, op, 1, srcCoords, destCoords);
  }
}
