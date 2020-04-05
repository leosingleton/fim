// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { fileRead } from './FileRead';
import { NodeEngineImage } from './NodeEngineImage';
import { FimNode } from '../api/FimNode';
import { CoreNodeCanvas2D } from '../core/CoreNodeCanvas2D';
import { CoreNodeCanvasWebGL } from '../core/CoreNodeCanvasWebGL';
import { CoreNodeImageFile } from '../core/CoreNodeImageFile';
import { FimDimensions, FimImageOptions, FimObject } from '@leosingleton/fim';
import { CoreCanvas2D, CoreCanvasOptions, CoreCanvasWebGL, EngineFimBase, EngineShader,
  fileToName } from '@leosingleton/fim/internals';
import { GlslShader } from 'webpack-glsl-minify';

/** Implementation of `EngineFim` for Node.js */
export class NodeEngineFim extends EngineFimBase<NodeEngineImage, EngineShader> implements FimNode {
  protected createEngineImage(parent: FimObject, options: FimImageOptions, dimensions: FimDimensions, name?: string):
      NodeEngineImage {
    return new NodeEngineImage(parent, options, dimensions, name);
  }

  protected createEngineImageFromPngAsync(pngFile: Uint8Array, parent: FimObject, options: FimImageOptions,
      name?: string): Promise<NodeEngineImage> {
    return NodeEngineImage.createFromPngAsync(parent, pngFile, options, name);
  }

  protected createEngineImageFromJpegAsync(jpegFile: Uint8Array, parent: FimObject, options: FimImageOptions,
      name?: string): Promise<NodeEngineImage> {
    return NodeEngineImage.createFromJpegAsync(parent, jpegFile, options, name);
  }

  protected createEngineGLShader(parent: FimObject, fragmentShader: GlslShader, vertexShader?: GlslShader,
      name?: string): EngineShader {
    return new EngineShader(parent, fragmentShader, vertexShader, name);
  }

  public getCoreImageFile(): CoreNodeImageFile {
    return CoreNodeImageFile.instance;
  }

  public createCoreCanvas2D(options: CoreCanvasOptions, dimensions: FimDimensions, handle: string): CoreCanvas2D {
    return new CoreNodeCanvas2D(options, dimensions, handle, this.engineOptions);
  }

  public createCoreCanvasWebGL(options: CoreCanvasOptions, dimensions: FimDimensions, handle: string): CoreCanvasWebGL {
    return new CoreNodeCanvasWebGL(options, dimensions, handle, this.engineOptions);
  }

  public async createImageFromPngFileAsync(pngPath: string, options?: FimImageOptions, name?: string,
      parent?: FimObject): Promise<NodeEngineImage> {
    const pngFile = await fileRead(pngPath);
    return this.createImageFromPngAsync(pngFile, options, name ?? fileToName(pngPath), parent);
  }

  public async createImageFromJpegFileAsync(jpegPath: string, options?: FimImageOptions, name?: string,
      parent?: FimObject): Promise<NodeEngineImage> {
    const jpegFile = await fileRead(jpegPath);
    return this.createImageFromJpegAsync(jpegFile, options, name ?? fileToName(jpegPath), parent);
  }
}
