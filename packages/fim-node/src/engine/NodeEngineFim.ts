// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { NodeEngineImage } from './NodeEngineImage';
import { FimNode } from '../api/FimNode';
import { CoreNodeCanvas2D } from '../core/CoreNodeCanvas2D';
import { CoreNodeCanvasWebGL } from '../core/CoreNodeCanvasWebGL';
import { fileReader } from '../core/FileReader';
import { loadFromFileAsync } from '../core/ImageLoader';
import { FimDimensions, FimImageOptions, FimObject } from '@leosingleton/fim';
import { CoreCanvas2D, CoreCanvasOptions, CoreCanvasWebGL, EngineFimBase,
  EngineShader } from '@leosingleton/fim/internals';
import { GlslShader } from 'webpack-glsl-minify';

/** Implementation of `EngineFim` for Node.js */
export class NodeEngineFim extends EngineFimBase<NodeEngineImage, EngineShader> implements FimNode {
  /**
   * Constructor
   * @param maxImageDimensions Maximum dimensions of any image. If unspecified, defaults to the maximum image size
   *    supported by the WebGL capabilities of the browser and GPU.
   * @param name An optional name specified when creating the object to help with debugging
   */
  public constructor(maxImageDimensions?: FimDimensions, name?: string) {
    super(fileReader, loadFromFileAsync, maxImageDimensions, name);
  }

  protected createEngineImage(parent: FimObject, options: FimImageOptions, dimensions: FimDimensions, name?: string):
      NodeEngineImage {
    return new NodeEngineImage(parent, options, dimensions, name);
  }

  protected createEngineGLShader(parent: FimObject, fragmentShader: GlslShader, vertexShader?: GlslShader,
      name?: string): EngineShader {
    return new EngineShader(parent, fragmentShader, vertexShader, name);
  }

  public createCoreCanvas2D(options: CoreCanvasOptions, dimensions: FimDimensions, handle: string): CoreCanvas2D {
    return new CoreNodeCanvas2D(options, dimensions, handle, this.engineOptions);
  }

  public createCoreCanvasWebGL(options: CoreCanvasOptions, dimensions: FimDimensions, handle: string): CoreCanvasWebGL {
    return new CoreNodeCanvasWebGL(options, dimensions, handle, this.engineOptions);
  }
}
