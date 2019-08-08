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

function objectTypeToString(type: FimObjectType): string {
  let names = Object.keys(objectTypeMap);
  for (let n = 0; n < names.length; n++) {
    let name = names[n];
    if (objectTypeMap[name] === type) {
      return name;
    }
  }
  return null;
}

const objectTypeMap: { [name: string]: FimObjectType } = {
  Canvas2D: FimObjectType.Canvas2D,
  OffScreenCanvas: FimObjectType.OffscreenCanvas,
  GLCanvas: FimObjectType.GLCanvas,
  GLProgram: FimObjectType.GLProgram,
  GLTexture: FimObjectType.GLTexture
};

/**
 * Tracks the creation of an object
 * @param object The object itself
 * @param type Object type. See FimObjectType.
 * @param options Object-specific creation options
 * @param channels Number of channels. Used to estimate memory consumption.
 * @param bpp Bits per pixel. Used to estimate memory consumption.
 */
export function recordCreate(object: any, type: FimObjectType, options?: any, channels?: number, bpp?: number): void {
  if (FimConfig.config.debugLoggingEnabled) {
    // Build the console message
    let message = `Created ${objectTypeToString(type)}`;

    if (object instanceof FimImage) {
      let id = object.imageId;
      let dimensions = object.dimensions;
      let realDimensions = object.realDimensions;
      message += ` ID=${id} (${dimensions.w}x${dimensions.h} => ${realDimensions.w}x${realDimensions.h})`;

      if (channels && bpp) {
        let memory = (realDimensions.getArea() * channels * bpp) / (1024 * 1024 * 8);
        message += ` ${memory.toFixed(3)} MB`;
      }
    }

    if (options) {
      console.log(message, options);
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
    let message = `Disposed ${objectTypeToString(type)}`;

    if (object instanceof FimImage) {
      let id = object.imageId;
      message += ` ID=${id}`;
    }

    console.log(message);
  }
}
