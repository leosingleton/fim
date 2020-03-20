// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { EngineFim } from './EngineFim';
import { EngineImage } from './EngineImage';
import { EngineObject } from './EngineObject';
import { EngineShader } from './EngineShader';
import { FimResource, FimResourceMetrics, FimResourceUsage } from '../api/FimResourceUsage';
import { CoreCanvas } from '../core/CoreCanvas';
import { CoreCanvas2D } from '../core/CoreCanvas2D';
import { CoreCanvasOptions } from '../core/CoreCanvasOptions';
import { CoreCanvasWebGL } from '../core/CoreCanvasWebGL';
import { CoreShader } from '../core/CoreShader';
import { CoreTexture } from '../core/CoreTexture';
import { CoreTextureOptions } from '../core/CoreTextureOptions';
import { FimBitsPerPixel } from '../primitives/FimBitsPerPixel';
import { FimDimensions } from '../primitives/FimDimensions';
import { FimError } from '../primitives/FimError';

/** Class which belongs to each `EngineFim` instance dedicated to tracking resource utilization */
export class ResourceTracker {
  /**
   * Constructor
   * @param fim Parent FIM engine
   */
  public constructor(fim: EngineFim<EngineImage, EngineShader>) {
    this.fim = fim;
  }

  /** Parent FIM engine */
  private readonly fim: EngineFim<EngineImage, EngineShader>;

  /** Resource usage counters */
  public readonly usage = defaultResourceUsage();

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
    const props = ResourceTracker.getCoreObjectProperties(coreObject);

    if (props.memoryConsumed) {
      props.memoryConsumed *= multiplier;
    }

    // Update usage counters
    me.usage[props.resourceType].instances += multiplier;
    me.usage[FimResource.Totals].instances += multiplier;
    if (props.isWebGL) {
      me.usage[props.resourceType].glMemory += props.memoryConsumed;
      me.usage[FimResource.Totals].glMemory += props.memoryConsumed;
    } else {
      me.usage[props.resourceType].nonGLMemory += props.memoryConsumed;
      me.usage[FimResource.Totals].nonGLMemory += props.memoryConsumed;
    }

    // Write the tracing message
    if (me.fim.engineOptions.showTracing) {
      const className = ResourceTracker.getClassName(coreObject);
      let message = `${operation} ${className} (${props.resourceType}) ${coreObject.handle}`;

      if (props.dim && props.bpp) {
        const mb = (props.memoryConsumed / (1024 * 1024)).toFixed(2);
        message += ` ${props.dim}x${props.bpp} (${mb} MB)`;
      }

      if (props.objectOptions) {
        message += ` ${JSON.stringify(props.objectOptions)}`;
      }

      me.fim.writeTrace(engineObject, message);
    }
  }

  /**
   * Returns the class name of an object as a string
   * @param object Any object
   * @return String containing the class name
   */
  private static getClassName(object: any): string {
    return object.constructor.name;
  }

  /** Helper function to extract properties from a `CoreObject` instance */
  private static getCoreObjectProperties(object: CoreObject): CoreObjectProperties {
    if (object instanceof CoreCanvas) {
      const isWebGL = (object instanceof CoreCanvasWebGL);
      return {
        resourceType: isWebGL ? FimResource.CanvasWebGL : FimResource.Canvas2D,
        isWebGL,
        dim: object.dim,
        bpp: FimBitsPerPixel.BPP8,
        memoryConsumed: object.dim.getArea() * 4,
        objectOptions: object.canvasOptions
      };
    } else if (object instanceof CoreShader) {
      return {
        resourceType: FimResource.GLShader,
        isWebGL: true
      };
    } else if (object instanceof CoreTexture) {
      return {
        resourceType: FimResource.GLTexture,
        isWebGL: true,
        dim: object.dim,
        bpp: object.textureOptions.bpp,
        memoryConsumed: object.dim.getArea() * object.textureOptions.bpp * 0.5,
        objectOptions: object.textureOptions
      };
    } else {
      FimError.throwOnUnreachableCodeValue(object);
    }
  }
}

/** Shorthand for the four core object types we track */
type CoreObject = CoreCanvas2D | CoreCanvasWebGL | CoreShader | CoreTexture;

/** Properties returned by `ResourceTracker.getCoreObjectProperties()` */
interface CoreObjectProperties {
  /** Type of the resource (`FimResource` enum) */
  resourceType: FimResource,

  /** Whether the resource is a WebGL resource */
  isWebGL: boolean;

  /** Dimensions of the resource, used to estimate memory usage. May be undefined for shaders. */
  dim?: FimDimensions,

  /** Color depth of the resource, used to estimate memory usage. May be undefined for shaders. */
  bpp?: FimBitsPerPixel,

  /** Estimated memory consumption, in MB */
  memoryConsumed?: number,

  /** Object-specific creation options, optionally provided for logging */
  objectOptions?: CoreCanvasOptions | CoreTextureOptions;
}

/** Non-readonly version of `FimResourceUsage` */
interface ResourceUsage extends FimResourceUsage {
  [resource: string]: ResourceMetrics;
}

/** Returns an instance of `ResourceUsage` initialized to default values */
function defaultResourceUsage(): ResourceUsage {
  const usage: ResourceUsage = {};
  usage[FimResource.Canvas2D] = defaultResourceMetrics();
  usage[FimResource.CanvasWebGL] = defaultResourceMetrics();
  usage[FimResource.GLShader] = defaultResourceMetrics();
  usage[FimResource.GLTexture] = defaultResourceMetrics();
  usage[FimResource.Totals] = defaultResourceMetrics();
  return usage;
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
