// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { CoreCanvasWebGL } from './CoreCanvasWebGL';
import { CoreWebGLObject } from './CoreWebGLObject';

/** Wrapper around WebGL fragment shaders */
export class CoreShader extends CoreWebGLObject {
  /**
   * Constructor
   * @param parent The parent WebGL canvas
   */
  public constructor(parent: CoreCanvasWebGL) {
    super(parent);
  }
}
