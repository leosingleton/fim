// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { ModuleBase, ModuleCoreObject, ModuleCreateDispose, ModuleImageFormat,
  ModuleImageOperation, ModuleOperationType } from './ModuleBase';
import { EngineImage } from '../EngineImage';
import { EngineObject } from '../EngineObject';
import { EngineShader } from '../EngineShader';
import { FimExecutionStats, FimImageStats, FimImageStatsByResource, FimImageStatsByResourceAndOperation,
  FimShaderStats } from '../../api/FimExecutionStats';
import { FimError } from '../../primitives/FimError';

/** Collects execution stats on `FimImage` and `FimShader` objects */
export class ModuleStats extends ModuleBase {
  public imageHandles: { [handle: string]: ImageStats } = {};
  public shaderHandles: { [handle: string]: ShaderStats } = {};

  public onEngineObjectCreateDispose(_object: EngineObject, _operation: ModuleCreateDispose): void {
    // Not used by this module
  }

  public onCoreObjectCreateDispose(_parent: EngineObject, _object: ModuleCoreObject,
      _operation: ModuleCreateDispose): void {
    // Not used by this module
  }

  public onImageOperation(image: EngineImage, format: ModuleImageFormat, type: ModuleOperationType,
      operation: ModuleImageOperation): void {
    // Find the ImageStats object. Create on first use.
    let imageStats = this.imageHandles[image.objectHandle];
    if (!imageStats) {
      imageStats = this.imageHandles[image.objectHandle] = new ImageStats();
    }

    imageStats.recordOperation(format, type, operation);
  }

  public onShaderExecution(shader: EngineShader, executionTime: number, megaPixels: number): void {
    // Find the ShaderStats object. Create on first use.
    let shaderStats = this.shaderHandles[shader.objectHandle] as ShaderStats;
    if (!shaderStats) {
      shaderStats = this.shaderHandles[shader.objectHandle] = new ShaderStats();
    }

    shaderStats.recordExecution(executionTime, megaPixels);
  }

  /**
   * Returns a `FimExecutionStats` object that can be returned via the public API, as it is a clone of all properties,
   * not the original references.
   */
  public createPublicObject(): FimExecutionStats {
    const me = this;
    const result: FimExecutionStats = {
      imageHandles: {},
      shaderHandles: {}
    };

    for (const handle in me.imageHandles) {
      const stats = me.imageHandles[handle].createPublicObject();
      if (stats) {
        result.imageHandles[handle] = stats;
      }
    }
    for (const handle in me.shaderHandles) {
      const stats = me.shaderHandles[handle].createPublicObject();
      if (stats) {
        result.shaderHandles[handle] = stats;
      }
    }

    return result;
  }
}

/** Internal implementation of `FimImageStats` */
class ImageStats {
  private canvas2D = new ImageStatsByResource();
  private glTexture = new ImageStatsByResource();

  public recordOperation(format: ModuleImageFormat, type: ModuleOperationType,
      operation: ModuleImageOperation): void {
    switch (format) {
      case ModuleImageFormat.Canvas:  this.canvas2D.recordOperation(type, operation);   break;
      case ModuleImageFormat.Texture: this.glTexture.recordOperation(type, operation);  break;
      default:  FimError.throwOnUnreachableCodeValue(format);
    }
  }

  public createPublicObject(): FimImageStats {
    return {
      canvas2D: this.canvas2D.createPublicObject(),
      glTexture: this.glTexture.createPublicObject()
    };
  }
}

/** Internal implementation of the `FimImageStatsByResource` interface */
export class ImageStatsByResource {
  private explicit = new ImageStatsByResourceAndOperation();
  private importExport = new ImageStatsByResourceAndOperation();
  private internalConversion = new ImageStatsByResourceAndOperation();

  public recordOperation(type: ModuleOperationType, operation: ModuleImageOperation): void {
    switch (type) {
      case ModuleOperationType.Explicit:            this.explicit.recordOperation(operation);           break;
      case ModuleOperationType.ImportExport:        this.importExport.recordOperation(operation);       break;
      case ModuleOperationType.InternalConversion:  this.internalConversion.recordOperation(operation); break;
      default:  FimError.throwOnUnreachableCodeValue(type);
    }
  }

  public createPublicObject(): FimImageStatsByResource {
    const me = this;

    if (me.explicit || me.importExport || me.internalConversion) {
      return {
        explicit: this.explicit.createPublicObject(),
        importExport: this.importExport.createPublicObject(),
        internalConversion: this.internalConversion.createPublicObject()
      };
    } else {
      return undefined;
    }
  }
}

/** Internal implementation of the `FimImageStatsByResourceAndOperation` interface */
export class ImageStatsByResourceAndOperation {
  private readCount = 0;
  private writeCount = 0;

  public recordOperation(operation: ModuleImageOperation): void {
    switch (operation) {
      case ModuleImageOperation.Read:   this.readCount++;   break;
      case ModuleImageOperation.Write:  this.writeCount++;  break;
      default:  FimError.throwOnUnreachableCodeValue(operation);
    }
  }

  public createPublicObject(): FimImageStatsByResourceAndOperation {
    const me = this;

    if (me.readCount || me.writeCount) {
      return {
        readCount: me.readCount,
        writeCount: me.writeCount
      };
    } else {
      return undefined;
    }
  }
}

/** Stores per-shader stats */
class ShaderStats {
  /** Number of shader executions */
  public executionCount = 0;

  /** Total execution time, in milliseconds. Used internally to compute the `avgExecutionTime` */
  public totalExecutionTime = 0;

  /** Total number of pixels rendered, in millions. Used internally to compute the `avgExecutionTimePMP` */
  public totalMegaPixels = 0;

  public recordExecution(executionTime: number, megaPixels: number): void {
    this.executionCount++;
    this.totalExecutionTime += executionTime;
    this.totalMegaPixels += megaPixels;
  }

  public createPublicObject(): FimShaderStats {
    const me = this;

    return {
      executionCount: me.executionCount,
      avgExecutionTime: me.totalExecutionTime / me.executionCount,
      avgExecutionTimePMP: me.totalExecutionTime / me.totalMegaPixels
    };
  }
}
