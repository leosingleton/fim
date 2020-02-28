// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimDimensions, FimError, FimErrorCode, FimEngineOptions, FimImageOptions } from '@leosingleton/fim';
import { CoreCanvasWebGL, RenderingContextWebGL } from '@leosingleton/fim/internals';
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

  protected getContext(): RenderingContextWebGL {
    return this.glContext;
  }
}
