// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { NodeEngineImage } from './NodeEngineImage';
import { CoreNodeCanvas2D } from '../core/CoreNodeCanvas2D';
import { CoreNodeCanvasWebGL } from '../core/CoreNodeCanvasWebGL';
import { FimDimensions, FimImageOptions } from '@leosingleton/fim';
import { CoreCanvas2D, CoreCanvasOptions, CoreCanvasWebGL, EngineFim, EngineShader } from '@leosingleton/fim/internals';
import { GlslShader } from 'webpack-glsl-minify';

export class NodeEngineFim extends EngineFim<NodeEngineImage, EngineShader> {
  protected createEngineImage(options: FimImageOptions, dimensions: FimDimensions, imageName?: string):
      NodeEngineImage {
    return new NodeEngineImage(this, options, dimensions, imageName);
  }

  protected createEngineImageFromPngAsync(pngFile: Uint8Array, options: FimImageOptions, imageName?: string):
      Promise<NodeEngineImage> {
    return NodeEngineImage.createFromPngAsync(this, pngFile, options, imageName);
  }

  protected createEngineImageFromJpegAsync(jpegFile: Uint8Array, options: FimImageOptions, imageName?: string):
      Promise<NodeEngineImage> {
    return NodeEngineImage.createFromJpegAsync(this, jpegFile, options, imageName);
  }

  public createGLShader(fragmentShader: GlslShader, vertexShader?: GlslShader, shaderName?: string): EngineShader {
    return new EngineShader(this, fragmentShader, vertexShader, shaderName);
  }

  public createCoreCanvas2D(options: CoreCanvasOptions, dimensions: FimDimensions, handle: string): CoreCanvas2D {
    return new CoreNodeCanvas2D(options, dimensions, handle, this.engineOptions);
  }

  public createCoreCanvasWebGL(options: CoreCanvasOptions, dimensions: FimDimensions, handle: string): CoreCanvasWebGL {
    return new CoreNodeCanvasWebGL(options, dimensions, handle, this.engineOptions);
  }
}
