// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { NodeEngineImage } from './NodeEngineImage';
import { CoreNodeCanvas2D } from '../core/CoreNodeCanvas2D';
import { CoreNodeCanvasWebGL } from '../core/CoreNodeCanvasWebGL';
import { FimDimensions, FimImageOptions } from '@leosingleton/fim';
import { CoreCanvas2D, CoreCanvasOptions, CoreCanvasWebGL, EngineFimBase,
  EngineShader } from '@leosingleton/fim/internals';
import { GlslShader } from 'webpack-glsl-minify';

export class NodeEngineFim extends EngineFimBase<NodeEngineImage, EngineShader> {
  protected createEngineImage(options: FimImageOptions, dimensions: FimDimensions, name?: string):
      NodeEngineImage {
    return new NodeEngineImage(this, options, dimensions, name);
  }

  protected createEngineImageFromPngAsync(pngFile: Uint8Array, options: FimImageOptions, name?: string):
      Promise<NodeEngineImage> {
    return NodeEngineImage.createFromPngAsync(this, pngFile, options, name);
  }

  protected createEngineImageFromJpegAsync(jpegFile: Uint8Array, options: FimImageOptions, name?: string):
      Promise<NodeEngineImage> {
    return NodeEngineImage.createFromJpegAsync(this, jpegFile, options, name);
  }

  public createGLShader(fragmentShader: GlslShader, vertexShader?: GlslShader, name?: string): EngineShader {
    return new EngineShader(this, fragmentShader, vertexShader, name);
  }

  public createCoreCanvas2D(options: CoreCanvasOptions, dimensions: FimDimensions, handle: string): CoreCanvas2D {
    return new CoreNodeCanvas2D(options, dimensions, handle, this.engineOptions);
  }

  public createCoreCanvasWebGL(options: CoreCanvasOptions, dimensions: FimDimensions, handle: string): CoreCanvasWebGL {
    return new CoreNodeCanvasWebGL(options, dimensions, handle, this.engineOptions);
  }
}
