// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { CoreNodeCanvas2D } from './CoreNodeCanvas2D';
import { CoreNodeTexture } from './CoreNodeTexture';
import { FimDimensions, FimError, FimErrorCode, FimEngineOptions } from '@leosingleton/fim';
import { CoreCanvas2D, CoreCanvasOptions, CoreCanvasWebGL, CoreTextureOptions,
  RenderingContextWebGL } from '@leosingleton/fim/internals';
import createContext from 'gl';

/** Wrapper around the headless-gl WebGL library */
export class CoreNodeCanvasWebGL extends CoreCanvasWebGL {
  public constructor(canvasOptions: CoreCanvasOptions, canvasDimensions: FimDimensions, imageHandle: string,
      engineOptions?: FimEngineOptions) {
    super(canvasOptions, canvasDimensions, imageHandle, engineOptions);

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

  protected createCanvas2D(canvasOptions: CoreCanvasOptions, canvasDimensions: FimDimensions, imageHandle: string,
      engineOptions: FimEngineOptions): CoreCanvas2D {
    return new CoreNodeCanvas2D(canvasOptions, canvasDimensions, imageHandle, engineOptions);
  }

  protected createCoreTextureInternal(parent: CoreCanvasWebGL, options: CoreTextureOptions, dimensions: FimDimensions,
      handle: string): CoreNodeTexture {
    return new CoreNodeTexture(parent, options, dimensions, handle);
  }

  protected addCanvasEventListener(_type: string, _listener: EventListenerObject, _options: boolean): void {
    // Not supported by headless-gl
  }

  protected removeCanvasEventListener(_type: string, _listener: EventListenerObject, _options: boolean): void {
    // Not supported by headless-gl
  }
}
