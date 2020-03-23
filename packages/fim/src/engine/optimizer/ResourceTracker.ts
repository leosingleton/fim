// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { getClassName, memoryToString } from './Logging';
import { EngineFim } from '../EngineFim';
import { EngineObject } from '../EngineObject';
import { FimResourceMetrics, FimResourceUsage } from '../../api/FimResourceUsage';
import { CoreCanvas } from '../../core/CoreCanvas';
import { CoreCanvas2D } from '../../core/CoreCanvas2D';
import { CoreCanvasOptions } from '../../core/CoreCanvasOptions';
import { CoreCanvasWebGL } from '../../core/CoreCanvasWebGL';
import { CoreShader } from '../../core/CoreShader';
import { CoreTexture } from '../../core/CoreTexture';
import { CoreTextureOptions } from '../../core/CoreTextureOptions';
import { FimBitsPerPixel } from '../../primitives/FimBitsPerPixel';
import { FimDimensions } from '../../primitives/FimDimensions';
import { FimError } from '../../primitives/FimError';

/** Class which belongs to each `EngineFim` instance dedicated to tracking resource utilization */
export class ResourceTracker {
  /**
   * Constructor
   * @param fim Parent FIM engine
   */
  public constructor(fim: EngineFim) {
    this.fim = fim;
  }

  /** Parent FIM engine */
  private readonly fim: EngineFim;

  /** Total metrics on the current resource usage of this FIM instance */
  public readonly totals = defaultResourceMetrics();

  /** Metrics on the current resource usage of this FIM instance, broken down by resource type */
  public readonly metrics = defaultResourceUsage();

  /**
   * Tracks the creation of a core object
   * @param engineObject The engine object that performed the creation
   * @param coreObject The object that was created
   */
  public recordCreate(engineObject: EngineObject, coreObject: CoreObject): void {
    this.recordInternal('Create', 1, engineObject, coreObject);
  }

  /**
   * Tracks the disposal of a core object
   * @param engineObject The engine object that performed the disposal
   * @param coreObject The object that was disposed
   */
  public recordDispose(engineObject: EngineObject, coreObject: CoreObject): void {
    this.recordInternal('Dispose', -1, engineObject, coreObject);
  }

  /**
   * Internal implementation of `recordCreate()` and `recordDispose()`
   * @param operation String identifying the operation, i.e. 'Create' or 'Dispose'
   * @param multiplier 1 for create; -1 for dispose
   * @param engineObject The engine object that performed the disposal
   * @param coreObject The object that was disposed
   */
  private recordInternal(operation: string, multiplier: number, engineObject: EngineObject, coreObject: CoreObject):
      void {
    const me = this;

    // Extract the properties and type of the core object
    let isWebGL = true;
    let metrics: ResourceMetrics;
    let options: CoreCanvasOptions | CoreTextureOptions;
    let dimensions: FimDimensions;
    let bpp: FimBitsPerPixel;
    let memory = 0;
    if (coreObject instanceof CoreCanvas) {
      isWebGL = (coreObject instanceof CoreCanvasWebGL);
      metrics = isWebGL ? me.metrics.canvasWebGL : me.metrics.canvas2D;
      options = coreObject.canvasOptions;
      dimensions = coreObject.dim;
      bpp = FimBitsPerPixel.BPP8;
      memory = dimensions.getArea() * 4 * multiplier;
    } else if (coreObject instanceof CoreShader) {
      metrics = me.metrics.glShader;
    } else if (coreObject instanceof CoreTexture) {
      metrics = me.metrics.glTexture;
      options = coreObject.textureOptions;
      dimensions = coreObject.dim;
      bpp = (options as CoreTextureOptions).bpp;
      memory = dimensions.getArea() * bpp * 0.5 * multiplier;
    } else {
      FimError.throwOnUnreachableCodeValue(coreObject);
    }

    // Update usage counters
    metrics.instances += multiplier;
    me.totals.instances += multiplier;
    if (isWebGL) {
      metrics.glMemory += memory;
      me.totals.glMemory += memory;
    } else {
      metrics.nonGLMemory += memory;
      me.totals.nonGLMemory += memory;
    }

    // Write the tracing message
    if (me.fim.engineOptions.showTracing) {
      const className = getClassName(coreObject);
      let message = `${operation} ${className} ${coreObject.handle}`;

      if (dimensions && bpp) {
        message += ` ${dimensions}x${bpp} (${memoryToString(memory)})`;
      }

      if (options) {
        message += ` ${JSON.stringify(options)}`;
      }

      me.fim.writeTrace(engineObject, message);
    }
  }
}

/** Shorthand for the four core object types we track */
type CoreObject = CoreCanvas2D | CoreCanvasWebGL | CoreShader | CoreTexture;

/** Non-readonly version of `FimResourceUsage` */
interface ResourceUsage extends FimResourceUsage {
  canvas2D: ResourceMetrics;
  canvasWebGL: ResourceMetrics;
  glShader: ResourceMetrics;
  glTexture: ResourceMetrics;
}

/** Returns an instance of `ResourceUsage` initialized to default values */
function defaultResourceUsage(): ResourceUsage {
  return {
    canvas2D: defaultResourceMetrics(),
    canvasWebGL: defaultResourceMetrics(),
    glShader: defaultResourceMetrics(),
    glTexture: defaultResourceMetrics()
  };
}

/** Non-readonly version of `FimResourceMetrics` */
interface ResourceMetrics extends FimResourceMetrics {
  instances: number;
  nonGLMemory: number;
  glMemory: number;
}

/** Returns an instance of `ResourceMetrics` initialized to default values */
function defaultResourceMetrics(): ResourceMetrics {
  return {
    instances: 0,
    nonGLMemory: 0,
    glMemory: 0
  };
}
