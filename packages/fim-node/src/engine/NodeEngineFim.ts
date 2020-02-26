// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { NodeEngineImage } from './NodeEngineImage';
import { CoreNodeCanvas2D } from '../core/CoreNodeCanvas2D';
import { CoreNodeCanvasWebGL } from '../core/CoreNodeCanvasWebGL';
import { FimDimensions, FimImageOptions } from '@leosingleton/fim';
import { CoreCanvas2D, CoreCanvasWebGL, EngineFim, EngineShader } from '@leosingleton/fim/internals';

export class NodeEngineFim extends EngineFim<NodeEngineImage, EngineShader> {
  protected createEngineImage(dimensions: FimDimensions, options: FimImageOptions, imageName?: string):
      NodeEngineImage {
    return new NodeEngineImage(this, dimensions, options, imageName);
  }

  public createCoreCanvas2D(dimensions: FimDimensions, handle: string, options: FimImageOptions): CoreCanvas2D {
    return new CoreNodeCanvas2D(dimensions, handle, this.engineOptions, options);
  }

  public createCoreCanvasWebGL(dimensions: FimDimensions, handle: string, options: FimImageOptions): CoreCanvasWebGL {
    return new CoreNodeCanvasWebGL(dimensions, handle, this.engineOptions, options);
  }
}
