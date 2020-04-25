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

  public onEngineObjectCreateDispose(object: EngineObject, operation: ModuleCreateDispose): void {
    const me = this;
    const handle = object.objectHandle;

    // When an image or shader object is disposed, consolidate its stats under a single record representing all disposed
    // objects
    if (operation === ModuleCreateDispose.Dispose) {
      if (object instanceof EngineImage) {
        // Get the image's stats. Add them to the entry named 'disposed'.
        const stats = me.findOrCreateImage(handle);
        const disposed = me.findOrCreateImage('disposed');
        disposed.addValues(stats);

        // Delete the image's stats
        delete me.imageHandles[handle];
      } else if (object instanceof EngineShader) {
        // Get the shader's stats. Add them to the entry named 'disposed'.
        const stats = me.findOrCreateShader(handle);
        const disposed = me.findOrCreateShader('disposed');
        disposed.addValues(stats);

        // Delete the shader's stats
        delete me.shaderHandles[handle];
      }
    }
  }

  public onCoreObjectCreateDispose(_parent: EngineObject, _object: ModuleCoreObject,
      _operation: ModuleCreateDispose): void {
    // Not used by this module
  }

  public onImageOperation(image: EngineImage, format: ModuleImageFormat, type: ModuleOperationType,
      operation: ModuleImageOperation): void {
    this.findOrCreateImage(image.objectHandle).recordOperation(format, type, operation);
  }

  public onShaderExecution(shader: EngineShader, executionTime: number, megaPixels: number): void {
    this.findOrCreateShader(shader.objectHandle).recordExecution(executionTime, megaPixels);
  }

  /**
   * Finds or creates an `ImageStats` object for an image
   * @param handle Image handle
   */
  private findOrCreateImage(handle: string): ImageStats {
    let imageStats = this.imageHandles[handle];
    if (!imageStats) {
      imageStats = this.imageHandles[handle] = new ImageStats();
    }
    return imageStats;
  }

  /**
   * Finds or creates a `ShaderStats` object for a shader
   * @param handle Shader handle
   */
  private findOrCreateShader(handle: string): ShaderStats {
    let shaderStats = this.shaderHandles[handle] as ShaderStats;
    if (!shaderStats) {
      shaderStats = this.shaderHandles[handle] = new ShaderStats();
    }
    return shaderStats;
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

  /**
   * Adds the values from another `ImageStats` object to this one
   * @param stats Stats to add
   */
  public addValues(stats: ImageStats): void {
    this.canvas2D.addValues(stats.canvas2D);
    this.glTexture.addValues(stats.glTexture);
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

  public addValues(stats: ImageStatsByResource): void {
    this.explicit.addValues(stats.explicit);
    this.importExport.addValues(stats.importExport);
    this.internalConversion.addValues(stats.internalConversion);
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

  public addValues(stats: ImageStatsByResourceAndOperation): void {
    this.readCount += stats.readCount;
    this.writeCount += stats.writeCount;
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

  /**
   * Adds the values from another `ShaderStats` object to this one
   * @param stats Stats to add
   */
  public addValues(stats: ShaderStats): void {
    this.executionCount += stats.executionCount;
    this.totalExecutionTime += stats.totalExecutionTime;
    this.totalMegaPixels += stats.totalMegaPixels;
  }
}
