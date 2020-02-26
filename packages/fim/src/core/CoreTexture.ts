// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { CoreCanvasWebGL } from './CoreCanvasWebGL';
import { CoreWebGLObject } from './CoreWebGLObject';
import { FimDimensions } from '../primitives/FimDimensions';

/** Wrapper around WebGL textures */
export class CoreTexture extends CoreWebGLObject {
  /**
   * Constructor
   * @param parent The parent WebGL canvas
   * @param dimensions Texture dimensions
   */
  public constructor(parent: CoreCanvasWebGL, dimensions: FimDimensions) {
    super(parent);
    this.textureDimensions = dimensions.toFloor();
  }

  /** Texture dimensions */
  public readonly textureDimensions: FimDimensions;
}
