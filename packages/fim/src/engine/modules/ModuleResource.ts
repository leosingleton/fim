// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { ModuleBase, ModuleCoreObject, ModuleCreateDispose, ModuleImageFormat, ModuleImageOperation,
  ModuleOperationType } from './ModuleBase';
import { EngineImage } from '../EngineImage';
import { EngineObject } from '../EngineObject';
import { EngineShader } from '../EngineShader';
import { FimResourceUsage, FimResourceMetrics } from '../../api/FimResourceUsage';
import { CoreCanvas } from '../../core/CoreCanvas';
import { CoreCanvasOptions } from '../../core/CoreCanvasOptions';
import { CoreCanvasWebGL } from '../../core/CoreCanvasWebGL';
import { CoreShader } from '../../core/CoreShader';
import { CoreTexture } from '../../core/CoreTexture';
import { CoreTextureOptions } from '../../core/CoreTextureOptions';
import { FimBitsPerPixel } from '../../primitives/FimBitsPerPixel';
import { FimDimensions } from '../../primitives/FimDimensions';
import { FimError } from '../../primitives/FimError';

/** Module to track resource usage */
export class ModuleResource extends ModuleBase {
  /** Total metrics on the current resource usage of this FIM instance */
  public readonly totals = defaultResourceMetrics();

  /** Metrics on the current resource usage of this FIM instance, broken down by resource type */
  public readonly metrics = defaultResourceUsage();

  public onEngineObjectCreateDispose(_object: EngineObject, _operation: ModuleCreateDispose): void {
    // Not used by this module
  }

  public onCoreObjectCreateDispose(parent: EngineObject, object: ModuleCoreObject,
      operation: ModuleCreateDispose): void {
    const me = this;
    const multiplier = (operation === ModuleCreateDispose.Create) ? 1 : -1;

    // Extract the properties and type of the core object
    let isWebGL = true;
    let metrics: ResourceMetrics;
    let options: CoreCanvasOptions | CoreTextureOptions;
    let dimensions: FimDimensions;
    let bpp: FimBitsPerPixel;
    let memory = 0;
    if (object instanceof CoreCanvas) {
      isWebGL = (object instanceof CoreCanvasWebGL);
      metrics = isWebGL ? me.metrics.canvasWebGL : me.metrics.canvas2D;
      options = object.canvasOptions;
      dimensions = object.dim;
      bpp = FimBitsPerPixel.BPP8;
      memory = dimensions.getArea() * 4 * multiplier;
    } else if (object instanceof CoreShader) {
      metrics = me.metrics.glShader;
    } else if (object instanceof CoreTexture) {
      metrics = me.metrics.glTexture;
      options = object.textureOptions;
      dimensions = object.dim;
      bpp = (options as CoreTextureOptions).bpp;
      memory = dimensions.getArea() * bpp * 0.5 * multiplier;
    } else {
      FimError.throwOnUnreachableCodeValue(object);
    }

    // Update usage counters
    metrics.instances += multiplier;
    me.totals.instances += multiplier;
    if (isWebGL) {
      metrics.glMemory += memory;
      me.totals.glMemory += memory;
    } else {
      metrics.canvasMemory += memory;
      me.totals.canvasMemory += memory;
    }

    // Write the tracing message
    //me.fim.logging.
    /*
    if (me.fim.engineOptions.showTracing) {
      const className = ResourceModule.getClassName(object);
      let message = `${operation} ${className} ${object.objectHandle}`;

      if (dimensions && bpp) {
        message += ` ${dimensions}x${bpp} (${ResourceModule.memoryToString(memory)})`;
      }

      if (options) {
        message += ` ${JSON.stringify(options)}`;
      }

      me.fim.writeTrace(engineObject, message);
    }*/
  }

  public onImageOperation(_image: EngineImage, _format: ModuleImageFormat, _type: ModuleOperationType,
      _operation: ModuleImageOperation): void {
    // Not used by this module
  }

  public onShaderExecution(_shader: EngineShader, _executionTime: number, _megaPixels: number): void {
    // Not used by this module
  }
}

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
  canvasMemory: number;
  glMemory: number;
}

/** Returns an instance of `ResourceMetrics` initialized to default values */
function defaultResourceMetrics(): ResourceMetrics {
  return {
    instances: 0,
    canvasMemory: 0,
    glMemory: 0
  };
}
