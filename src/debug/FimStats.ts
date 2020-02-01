// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimConfig } from './FimConfig';
import { FimImage } from '../image/FimImage';
import { FimGLCanvas } from '../gl/FimGLCanvas';
import { FimGLTexture } from '../gl/FimGLTexture';
import { FimGLProgram, UniformDefinitionMap } from '../gl/FimGLProgram';
import { FimRect } from '../primitives/FimRect';

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

function getClassName(object: any): string {
  return object.constructor.name;
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
    const className = getClassName(object);
    let message = `Create ${objectTypeToString(type)} ${className}`;

    if (object instanceof FimImage) {
      const id = object.imageId;
      const dimensions = object.imageDimensions;
      const realDimensions = object.realDimensions;
      message += ` ID=${id} (${dimensions.w}x${dimensions.h} => ${realDimensions.w}x${realDimensions.h})`;

      if (channels && bpp) {
        // Estimate memory consumed, in MB
        const memory = (realDimensions.getArea() * channels * bpp) / (1024 * 1024 * 8);

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
    const className = getClassName(object);
    let message = `Dispose ${objectTypeToString(type)} ${className}`;

    if (object instanceof FimImage) {
      const id = object.imageId;
      message += ` ID=${id}`;

      // Update memory consumed
      const memory = memoryMap[id];
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
const memoryMap: { [id: number]: number } = {};

/** Estimated GPU memory consumed, in MB */
let gpuMemory = 0;

/** Estimated total memory consumed by graphics, in MB */
let totalMemory = 0;

/**
 * Logs calls to texImage2D
 * @param src Source image
 * @param dest Destination texture
 */
export function recordTexImage2D(src: FimImage, dest: FimGLTexture): void {
  if (FimConfig.config.debugLoggingEnabled) {
    const srcClassName = getClassName(src);
    const destClassName = getClassName(dest);
    console.log(`texImage2D ${srcClassName} (${src.imageId}) => ${destClassName} (${dest.imageId})`);
  }
}

/**
 * Logs rendering of WebGL programs
 * @param program WebGL rogram being executed
 * @param uniforms Program uniforms
 * @param destCoords Destination coordinates
 * @param outputTexture Output texture or WebGL canvas
 */
export function recordWebGLRender(program: FimGLProgram, uniforms: UniformDefinitionMap, destCoords: FimRect,
    outputTexture: FimGLTexture | FimGLCanvas): void {
  if (FimConfig.config.debugLoggingEnabled) {
    // Build the console message
    const className = getClassName(program);
    let message = `Render ${className}`;

    // Extract any input textures from the uniforms
    let inputTextures = '';
    for (const name in uniforms) {
      const uniform = uniforms[name];

      if (uniform.variableType.indexOf('sampler') !== -1) {
        if (inputTextures.length > 0) {
          inputTextures += ', ';
        }

        const t = uniform.variableValue as FimGLTexture;
        const textureClassName = getClassName(t);
        inputTextures += `${textureClassName} (${t.imageId})`;
      }
    }

    const outputClassName = getClassName(outputTexture);
    message += ` [${inputTextures}] => ${outputClassName} (${outputTexture.imageId}) ${destCoords.w}x${destCoords.h}`;

    console.log(message);
  }
}

function coordsToString(coords: FimRect): string {
  return `[${coords.xLeft},${coords.yTop}-${coords.xRight},${coords.yBottom}]`;
}

/**
 * Logs calls to drawImage to copy pixels to a 2D canvas
 * @param srcCoords Source coordinates
 * @param destCoords Destination coordinates
 * @param op Compositie operation, e.g. 'copy' or 'source-over'
 * @param imageSmoothingEnabled Whether browser-specific image smoothing is enabled for the drawing context
 */
export function recordDrawImage(srcCoords: FimRect, destCoords: FimRect, op: string,
    imageSmoothingEnabled: boolean): void {
  if (FimConfig.config.debugLoggingEnabled) {
    const srcCoordsString = coordsToString(srcCoords);
    const destCoordsString = coordsToString(destCoords);
    console.log(`drawImage ${op} (smoothing=${imageSmoothingEnabled}) ${srcCoordsString} => ${destCoordsString}`);
  }
}
