// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { CoreNodeCanvas2D } from './CoreNodeCanvas2D';
import { CoreNodeTexture } from './CoreNodeTexture';
import { FimDimensions, FimError, FimErrorCode, FimEngineOptions, FimImageOptions } from '@leosingleton/fim';
import { CoreCanvas2D, CoreCanvasWebGL, RenderingContextWebGL } from '@leosingleton/fim/internals';
import createContext from 'gl';

/** Wrapper around the headless-gl WebGL library */
export class CoreNodeCanvasWebGL extends CoreCanvasWebGL {
  public constructor(canvasDimensions: FimDimensions, imageHandle: string, engineOptions?: FimEngineOptions,
      imageOptions?: FimImageOptions) {
    super(canvasDimensions, imageHandle, engineOptions, imageOptions);

    // Create the canvas using headless-gl
    this.glContext = createContext(canvasDimensions.w, canvasDimensions.h);

    this.finishInitialization();
  }

  private glContext: WebGLRenderingContext;

  protected disposeSelf(): void {
    const gl = this.glContext;
    if (gl) {
      const ext = gl.getExtension('STACKGL_destroy_context');
      ext.destroy();
      this.glContext = undefined;
    }
  }

  public getImageSource(): CanvasImageSource {
    throw new FimError(FimErrorCode.NotImplemented, 'getImageSource() unsupported for Node.js');
  }

  public createContext(): RenderingContextWebGL {
    return this.glContext;
  }

  protected createCanvas2D(canvasDimensions: FimDimensions, imageHandle: string, engineOptions: FimEngineOptions,
      imageOptions: FimImageOptions): CoreCanvas2D {
    return new CoreNodeCanvas2D(canvasDimensions, imageHandle, engineOptions, imageOptions);
  }

  protected createCoreTextureInternal(parent: CoreCanvasWebGL, handle: string, dimensions: FimDimensions,
      options: FimImageOptions): CoreNodeTexture {
    return new CoreNodeTexture(parent, handle, dimensions, options);
  }

  protected addCanvasEventListener(_type: string, _listener: EventListenerObject, _options: boolean): void {
    // Not supported by headless-gl
  }

  protected removeCanvasEventListener(_type: string, _listener: EventListenerObject, _options: boolean): void {
    // Not supported by headless-gl
  }
}
