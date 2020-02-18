// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimDimensions, FimError, FimErrorCode } from '@leosingleton/fim';
import { CoreCanvasWebGL, RenderingContextWebGL } from '@leosingleton/fim/internals';
import createContext from 'gl';

/** Wrapper around the headless-gl WebGL library */
export class CoreNodeCanvasWebGL extends CoreCanvasWebGL {
  public constructor(canvasDimensions: FimDimensions, imageHandle: string) {
    super(canvasDimensions, imageHandle);

    // Create the canvas using headless-gl
    const gl = this.glContext = createContext(canvasDimensions.w, canvasDimensions.h);
    if (!gl) {
      throw new FimError(FimErrorCode.NoWebGL);
    }
  }

  private glContext: WebGLRenderingContext;

  public dispose() {
    const gl = this.glContext;
    if (gl) {
      const ext = gl.getExtension('STACKGL_destroy_context');
      ext.destroy();
      delete this.glContext;
    }
  }

  public getImageSource(): CanvasImageSource {
    throw new Error('getImageSource() unsupported for Node.js');
  }

  protected getContext(): RenderingContextWebGL {
    return this.glContext;
  }
}
