// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { ImageFormat } from './ImageFormat';
import { OperationType } from './OperationType';
import { EngineImage } from '../EngineImage';
import { EngineShader } from '../EngineShader';
import { FimExecutionStats, FimImageStats, FimImageStatsByResource, FimImageStatsByResourceAndOperation,
  FimShaderStats } from '../../api/FimExecutionStats';
import { FimError } from '../../primitives/FimError';
import { deepCopy } from '@leosingleton/commonlibs';

/**
 * Implementation of the `FimExecutionStats` interface
 *
 * Note: This was quickly put together and I'm not too happy with the implementation. It doesn't really belong in the
 * optimizer... there should probably be a central place to send notifications and deliver them to multiple consumers,
 * with stats, logging, and optimizers all different. But it can be refactored later without changing the public API.
 */
export class ExecutionStats implements FimExecutionStats {
  public imageHandles: { [handle: string]: ImageStats } = {};
  public shaderHandles: { [handle: string]: ShaderStats } = {};

  //
  // The rest of the class consists of notifications matching the OptimizerBase interface...
  //

  public recordImageRead(image: EngineImage, format: ImageFormat, type: OperationType): void {
    const stats = this.getImageStatsByResourceAndOperation(image, format, type);
    stats.readCount++;
  }

  public recordImageWrite(image: EngineImage, format: ImageFormat, type: OperationType): void {
    const stats = this.getImageStatsByResourceAndOperation(image, format, type);
    stats.writeCount++;
  }

  private getImageStatsByResourceAndOperation(image: EngineImage, format: ImageFormat, type: OperationType):
      ImageStatsByResourceAndOperation {
    // Find the ImageStats object. Create on first use.
    let imageStats = this.imageHandles[image.objectHandle];
    if (!imageStats) {
      imageStats = this.imageHandles[image.objectHandle] = new ImageStats();
    }

    // Find the ImageStatsByResource object
    let imageStatsByResource: ImageStatsByResource;
    switch (format) {
      case ImageFormat.Canvas:  imageStatsByResource = imageStats.canvas2D;   break;
      case ImageFormat.Texture: imageStatsByResource = imageStats.glTexture;  break;
      default:                  FimError.throwOnUnreachableCodeValue(format);
    }

    // Find the ImageStatsByResourceAndOperation object
    switch (type) {
      case OperationType.Explicit:            return imageStatsByResource.explicit;
      case OperationType.ImportExport:        return imageStatsByResource.importExport;
      case OperationType.InternalConversion:  return imageStatsByResource.internalConversion;
      default:                                FimError.throwOnUnreachableCodeValue(type);
    }
  }

  public recordShaderUsage(shader: EngineShader, executionTime: number, pixelCount: number): void {
    // Find the ShaderStats object. Create on first use.
    let shaderStats = this.shaderHandles[shader.objectHandle] as ShaderStats;
    if (!shaderStats) {
      shaderStats = this.shaderHandles[shader.objectHandle] = new ShaderStats();
    }

    shaderStats.recordExecution(executionTime, pixelCount);
  }

  /** Makes a clone of this object containing only public properties */
  public clonePublicObject(): FimExecutionStats {
    const result = deepCopy(this);

    // Remove private properties
    for (const handle in result.shaderHandles) {
      delete result.shaderHandles[handle].totalExecutionTime;
      delete result.shaderHandles[handle].totalMillionPixels;
    }

    return result;
  }
}

/** Implementation of the `FimImageStats` interface */
export class ImageStats implements FimImageStats {
  public canvas2D = new ImageStatsByResource();
  public glTexture = new ImageStatsByResource();
}

/** Implementation of the `FimImageStatsByResource` interface */
export class ImageStatsByResource implements FimImageStatsByResource {
  public explicit = new ImageStatsByResourceAndOperation();
  public importExport = new ImageStatsByResourceAndOperation();
  public internalConversion = new ImageStatsByResourceAndOperation();
}

/** Implementation of the `FimImageStatsByResourceAndOperation` interface */
export class ImageStatsByResourceAndOperation implements FimImageStatsByResourceAndOperation {
  public readCount = 0;
  public writeCount = 0;
}

/** Implementation of the `FimShaderStats` interface */
export class ShaderStats implements FimShaderStats {
  public executionCount = 0;
  public avgExecutionTime: number;
  public avgExecutionTimePMP: number;

  /** Total execution time, in milliseconds. Used internally to compute the `avgExecutionTime` */
  public totalExecutionTime = 0;

  /** Total number of pixels rendered, in millions. Used internally to compute the `avgExecutionTimePMP` */
  public totalMillionPixels = 0;

  public recordExecution(executionTime: number, pixelCount: number): void {
    const me = this;

    // Increment counters
    me.executionCount++;
    me.totalExecutionTime += executionTime;
    me.totalMillionPixels += pixelCount / (1024 * 1024);

    // Recompute averages
    me.avgExecutionTime = me.totalExecutionTime / me.executionCount;
    me.avgExecutionTimePMP = me.totalExecutionTime / me.totalMillionPixels;
  }
}
