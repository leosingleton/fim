// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { CoreCanvas, CoreTexture } from '@leosingleton/fim/internals';

/** Implementation of `CoreTexture` for web browsers */
export class CoreBrowserTexture extends CoreTexture {
  protected copyFromInternal(srcCanvas: CoreCanvas): void {
    const me = this;
    const parent = me.parentCanvas;
    const gl = parent.getContext();

    // Report telemetry for debugging
    //recordTexImage2D(srcImage, this);

    me.bind(0);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    parent.throwWebGLErrorsDebug();
    const format = gl.RGBA;
    gl.texImage2D(gl.TEXTURE_2D, 0, format, format, gl.UNSIGNED_BYTE, srcCanvas.getImageSource() as HTMLImageElement);
    parent.throwWebGLErrorsDebug();
    me.unbind(0);
  }
}
