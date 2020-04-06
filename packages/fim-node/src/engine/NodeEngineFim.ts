// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { NodeEngineImage } from './NodeEngineImage';
import { FimNode } from '../api/FimNode';
import { CoreNodeCanvas2D } from '../core/CoreNodeCanvas2D';
import { CoreNodeCanvasWebGL } from '../core/CoreNodeCanvasWebGL';
import { fileReaderAsync } from '../core/FileReader';
import { loadFromFileAsync } from '../core/ImageLoader';
import { FimDimensions, FimImageOptions, FimObject } from '@leosingleton/fim';
import { CoreCanvas2D, CoreCanvasOptions, CoreCanvasWebGL, EngineFimBase,
  EngineShader } from '@leosingleton/fim/internals';
import { GlslShader } from 'webpack-glsl-minify';

/** Implementation of `EngineFim` for Node.js */
export class NodeEngineFim extends EngineFimBase<NodeEngineImage, EngineShader> implements FimNode {
  /**
   * Constructor
   * @param name An optional name specified when creating the object to help with debugging
   */
  public constructor(name?: string) {
    super(fileReaderAsync, loadFromFileAsync, name);
  }

  protected createEngineImage(parent: FimObject, dimensions: FimDimensions, options: FimImageOptions, name?: string):
      NodeEngineImage {
    return new NodeEngineImage(parent, dimensions, options, name);
  }

  protected createEngineGLShader(parent: FimObject, fragmentShader: GlslShader, vertexShader?: GlslShader,
      name?: string): EngineShader {
    return new EngineShader(parent, fragmentShader, vertexShader, name);
  }

  public createCoreCanvas2D(dimensions: FimDimensions, options: CoreCanvasOptions, handle: string): CoreCanvas2D {
    return new CoreNodeCanvas2D(dimensions, options, handle, this.engineOptions);
  }

  public createCoreCanvasWebGL(dimensions: FimDimensions, options: CoreCanvasOptions, handle: string): CoreCanvasWebGL {
    return new CoreNodeCanvasWebGL(dimensions, options, handle, this.engineOptions);
  }
}
