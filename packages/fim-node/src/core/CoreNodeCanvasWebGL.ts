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
  public constructor(dimensions: FimDimensions, canvasOptions: CoreCanvasOptions, handle: string,
      engineOptions?: FimEngineOptions) {
    super(dimensions, canvasOptions, handle, engineOptions);

    // Create the canvas using headless-gl
    this.glContext = createContext(dimensions.w, dimensions.h);

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

  protected createCanvas2D(dimensions: FimDimensions, canvasOptions: CoreCanvasOptions, handle: string,
      engineOptions: FimEngineOptions): CoreCanvas2D {
    return new CoreNodeCanvas2D(dimensions, canvasOptions, handle, engineOptions);
  }

  protected createCoreTextureInternal(parent: CoreCanvasWebGL, dimensions: FimDimensions, options: CoreTextureOptions,
      handle: string): CoreNodeTexture {
    return new CoreNodeTexture(parent, dimensions, options, handle);
  }

  protected addCanvasEventListener(_type: string, _listener: EventListenerObject, _options: boolean): void {
    // Not supported by headless-gl
  }

  protected removeCanvasEventListener(_type: string, _listener: EventListenerObject, _options: boolean): void {
    // Not supported by headless-gl
  }
}
