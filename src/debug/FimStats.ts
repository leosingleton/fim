// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimConfig } from './FimConfig';
import { FimImage } from '../image/FimImage';

/** Object types that we track statistics on */
export const enum FimObjectType {
  /** FimCanvas(useOffscreenCanvas = false) */
  Canvas2D,

  /** FimCanvas(useOffscreenCanvas = true) */
  OffscreenCanvas,

  /** FimGLCanvas */
  GLCanvas,

  /** FimGLProgram */
  GLProgram,

  /** FimGLTexture */
  GLTexture
}

const enum FimObjectTypeFlags {
  None = 0,
  GpuMemory = (1 << 0),
}

const objectTypeMap: { [enumValue: number]: [string, FimObjectTypeFlags] } = {};
objectTypeMap[FimObjectType.Canvas2D] = ['Canvas2D', FimObjectTypeFlags.None];
objectTypeMap[FimObjectType.OffscreenCanvas] = ['OffscreenCanvas', FimObjectTypeFlags.None];
objectTypeMap[FimObjectType.GLCanvas] = ['GLCanvas', FimObjectTypeFlags.GpuMemory];
objectTypeMap[FimObjectType.GLProgram] = ['GLProgram', FimObjectTypeFlags.None];
objectTypeMap[FimObjectType.GLTexture] = ['GLTexture', FimObjectTypeFlags.GpuMemory];

function objectTypeToString(type: FimObjectType): string {
  return objectTypeMap[type][0];
}

function objectTypeToFlags(type: FimObjectType): FimObjectTypeFlags {
  return objectTypeMap[type][1];
}

/**
 * Tracks the creation of an object
 * @param object The object itself
 * @param type Object type. See FimObjectType.
 * @param requestedOptions Object-specific creation options supplied to the constructor
 * @param actualOptions Object-specific creation options that were actually used
 * @param channels Number of channels. Used to estimate memory consumption.
 * @param bpp Bits per pixel. Used to estimate memory consumption.
 */
export function recordCreate(object: any, type: FimObjectType, requestedOptions?: any, actualOptions?: any,
    channels?: number, bpp?: number): void {
  if (FimConfig.config.debugLoggingEnabled) {
    // Build the console message
    let message = `Create ${objectTypeToString(type)}`;

    if (object instanceof FimImage) {
      let id = object.imageId;
      let dimensions = object.dimensions;
      let realDimensions = object.realDimensions;
      message += ` ID=${id} (${dimensions.w}x${dimensions.h} => ${realDimensions.w}x${realDimensions.h})`;

      if (channels && bpp) {
        // Estimate memory consumed, in MB
        let memory = (realDimensions.getArea() * channels * bpp) / (1024 * 1024 * 8);

        // Store the value so we can subtract it on dispose
        memoryMap[id] = memory;

        // Update counters
        totalMemory += memory;
        if (objectTypeToFlags(type) & FimObjectTypeFlags.GpuMemory) {
          gpuMemory += memory;
        }

        message += memoryToString(memory);
      }
    }

    if (requestedOptions || actualOptions) {
      console.log(message, requestedOptions || {}, actualOptions || {});
    } else {
      console.log(message);
    }
  }
}

/**
 * Tracks the deletion of an object
 * @param object The object itself
 * @param type Object type. See FimObjectType.
 */
export function recordDispose(object: any, type: FimObjectType): void {
  if (FimConfig.config.debugLoggingEnabled) {
    // Build the console message
    let message = `Dispose ${objectTypeToString(type)}`;

    if (object instanceof FimImage) {
      let id = object.imageId;
      message += ` ID=${id}`;

      // Update memory consumed
      let memory = memoryMap[id];
      if (memory) {
        totalMemory -= memory;
        if (objectTypeToFlags(type) & FimObjectTypeFlags.GpuMemory) {
          gpuMemory -= memory;
        }

        message += memoryToString(memory);
      }
    }

    console.log(message);
  }
}

function memoryToString(memory: number): string {
  return ` ${memory.toFixed(3)} MB (Current GPU: ${gpuMemory.toFixed(1)} MB Total: ${totalMemory.toFixed(1)} MB)`;
}

/** Map of FimImage.imageId to amount of memory consumed by that object, in MB */
let memoryMap: { [id: number]: number } = {};

/** Estimated GPU memory consumed, in MB */
let gpuMemory = 0;

/** Estimated total memory consumed by graphics, in MB */
let totalMemory = 0;
