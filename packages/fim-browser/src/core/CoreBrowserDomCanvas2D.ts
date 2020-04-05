// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { CoreBrowserCanvas2D } from './CoreBrowserCanvas2D';
import { DisposableCanvas, DomCanvasPool } from './DomCanvasPool';
import { loadFromFileAsync } from './ImageLoader';
import { FimDimensions, FimEngineOptions } from '@leosingleton/fim';
import { CoreCanvas2D, CoreCanvasOptions, CoreMimeType, RenderingContext2D } from '@leosingleton/fim/internals';

/** Wrapper around the HTML DOM canvas */
export class CoreBrowserDomCanvas2D extends CoreBrowserCanvas2D {
  public constructor(canvasOptions: CoreCanvasOptions, dimensions: FimDimensions, handle: string,
      engineOptions?: FimEngineOptions) {
    super(loadFromFileAsync, canvasOptions, dimensions, handle, engineOptions);

    // Create a hidden canvas
    const canvas = CoreBrowserDomCanvas2D.canvasPool.getCanvas();
    canvas.width = dimensions.w;
    canvas.height = dimensions.h;
    canvas.style.display = 'none';
    canvas.id = handle;
    document.body.appendChild(canvas);
    this.canvasElement = canvas;
  }

  /** Canvas pool of 2D canvases */
  private static canvasPool = new DomCanvasPool();

  /** Underlying canvas backing this object */
  private canvasElement: DisposableCanvas;

  protected disposeSelf(): void {
    this.canvasElement.dispose();
    this.canvasElement = undefined;
  }

  public getImageSource(): CanvasImageSource {
    return this.canvasElement;
  }

  protected createContext(): RenderingContext2D {
    return this.canvasElement.getContext('2d');
  }

  protected createCanvas2D(canvasOptions: CoreCanvasOptions, dimensions: FimDimensions, handle: string,
      engineOptions: FimEngineOptions): CoreCanvas2D {
    return new CoreBrowserDomCanvas2D(canvasOptions, dimensions, handle, engineOptions);
  }

  protected convertToBlobAsync(type: CoreMimeType, quality?: number): Promise<Blob> {
    return new Promise<Blob>(resolve => {
      this.canvasElement.toBlob(blob => resolve(blob), type, quality);
    });
  }
}
