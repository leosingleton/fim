// fim-node - Fast Image Manipulation Library for Node.js
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { CanvasLike } from '@leosingleton/fim/build/internal';
import { Canvas, createCanvas, createImageData } from 'canvas';
import createContext from 'gl';

export const enum MimeTypes {
  PNG = 'image/png',
  JPEG = 'image/jpeg'
}

/** OffscreenCanvas-like object for Node.js. Internally it uses the node-canvas and headless-gl packages. */
export class NodeOffscreenCanvas implements CanvasLike {
  protected constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  public readonly width: number;
  public readonly height: number;

  public dispose(): void {
    const gl = this.glContext;
    if (gl) {
      const ext = gl.getExtension('STACKGL_destroy_context');
      ext.destroy();
      delete this.glContext;
    }
  }

  public async convertToBuffer(options?: ImageEncodeOptions): Promise<Buffer> {
    switch (this.contextId) {
      case '2d':
        return this.convert2DToBuffer(options);

      case 'webgl':
        return this.convertGLToBuffer(options);

      default:
        this.invalidContextId();
    }
  }

  private convert2DToBuffer(options?: ImageEncodeOptions): Buffer {
    return NodeOffscreenCanvas.convertCanvasToBuffer(this.canvas, options);
  }

  private static convertCanvasToBuffer(canvas: Canvas, options?: ImageEncodeOptions): Buffer {
    // The default output type is PNG
    if (!options || options.type === MimeTypes.PNG) {
      return canvas.toBuffer(MimeTypes.PNG);
    } else if (options.type === MimeTypes.JPEG) {
      return canvas.toBuffer(MimeTypes.JPEG, { quality: options.quality });
    } else {
      throw new Error('Invalid: ' + options.type);
    }
  }

  protected convertGLToCanvas(): Canvas {
    const gl = this.glContext;
    const w = this.width;
    const h = this.height;

    // Read the raw pixels into a byte array
    const raw = new Uint8Array(w * h * 4);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    //FimGLError.throwOnError(gl);
    gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, raw);
    //FimGLError.throwOnError(gl);

    // Flip the image on the Y axis
    const row = w * 4;
    const temp = new Uint8Array(row);
    for (let y = 0; y < Math.floor(h / 2); y++) {
      const offset1 = y * row;
      const offset2 = (h - y - 1) * row;
      temp.set(raw.subarray(offset1, offset1 + row));
      raw.set(raw.subarray(offset2, offset2 + row), offset1);
      raw.set(temp, offset2);
    }

    // Copy the raw pixels on to a Canvas
    const canvas = new Canvas(w, h);
    const ctx = canvas.getContext('2d');
    const img = createImageData(new Uint8ClampedArray(raw), w, h);
    ctx.putImageData(img, 0, 0);

    return canvas;
  }

  private convertGLToBuffer(options?: ImageEncodeOptions): Buffer {
    const canvas = this.convertGLToCanvas();

    // The rest of the code is shared with Canvas2D
    return NodeOffscreenCanvas.convertCanvasToBuffer(canvas, options);
  }

  public async convertToBlob(options?: ImageEncodeOptions): Promise<Blob> {
    const buffer = await this.convertToBuffer(options);
    return new Blob([buffer], { type: options ? options.type || MimeTypes.PNG : MimeTypes.PNG });
  }

  public getContext(contextId: OffscreenRenderingContextId, options?: any): OffscreenRenderingContext {
    if (this.contextId && this.contextId !== contextId) {
      throw new Error('Invalid contextId');
    }

    const w = this.width;
    const h = this.height;

    let context: OffscreenRenderingContext;
    switch (contextId) {
      case '2d': {
        let canvasContext = this.canvasContext;
        if (!canvasContext) {
          const canvas = this.canvas = createCanvas(w, h);
          canvasContext = this.canvasContext = canvas.getContext('2d', options);
        }
        context = canvasContext as any;
        break;
      }

      case 'webgl': {
        let glContext = this.glContext;
        if (!glContext) {
          glContext = this.glContext = createContext(w, h);

          // The gl library doesn't populate the canvas read-only property, which FIM needs. Force it.
          (glContext.canvas as any) = this;
        }
        context = glContext;
        break;
      }

      default: {
        this.invalidContextId();
      }
    }

    this.contextId = contextId;
    return context;
  }

  public transferToImageBitmap(): ImageBitmap {
    throw new Error('Not Implemented');
  }

  public addEventListener(_type: string, _listener: EventListenerOrEventListenerObject,
      _options?: boolean | EventListenerOptions): void {

  }

  public dispatchEvent(_event: Event): boolean {
    return true;
  }

  public removeEventListener(_type: string, _listener: EventListenerOrEventListenerObject,
      _options?: boolean | EventListenerOptions): void {

  }

  private invalidContextId(): never {
    throw new Error('Only Canvas2D and WebGL are supported');
  }

  protected contextId?: '2d' | 'webgl';
  protected glContext: WebGLRenderingContext;
  protected canvas: Canvas;
  protected canvasContext: CanvasRenderingContext2D;
}
