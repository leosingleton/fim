// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { EngineFim } from '../EngineFim';
import { EngineImage } from '../EngineImage';
import { EngineObject } from '../EngineObject';
import { EngineShader } from '../EngineShader';
import { CoreCanvas2D } from '../../core/CoreCanvas2D';
import { CoreCanvasWebGL } from '../../core/CoreCanvasWebGL';
import { CoreShader } from '../../core/CoreShader';
import { CoreTexture } from '../../core/CoreTexture';

/**
 * To avoid a huge monolithic `EngineFim` class, separate module classes add functionality on to the core engine itself.
 * This base class defines the notifications that the core `EngineFim` instance delivers to these modules.
 */
export abstract class ModuleBase {
  /**
   * Constructor
   * @param fim Parent FIM engine
   */
  public constructor(protected readonly fim: EngineFim) {
  }

  /**
   * Notification when an engine object (image or shader) is created or disposed
   * @param object The image or shader
   * @param operation Create or Dispose
   */
  public abstract onEngineObjectCreateDispose(object: EngineObject, operation: ModuleCreateDispose): void;

  /**
   * Notification when a core object is created or disposed
   * @param parent The engine object that owns the core object
   * @param object The core object
   * @param operation Create or Dispose
   */
  public abstract onCoreObjectCreateDispose(parent: EngineObject, object: ModuleCoreObject,
    operation: ModuleCreateDispose): void;

  /**
   * Notification when an `EngineImage` instance is read from or written to
   * @param image `EngineImage` instance
   * @param format Format of the image contents, canvas or texture
   * @param type Type of operation that triggered the activity
   * @param operation Read or write
   */
  public abstract onImageOperation(image: EngineImage, format: ModuleImageFormat, type: ModuleOperationType,
    operation: ModuleImageOperation): void;

  /**
   * Notification when an `EngineShader` instance is used for execution
   * @param image `EngineShader` instance
   * @param executionTime Shader execution time, in milliseconds
   * @param megaPixels Number of pixels in the destination texture, in millions
   */
  public abstract onShaderExecution(shader: EngineShader, executionTime: number, megaPixels: number): void;

  /**
   * Returns the class name of an object as a string
   * @param object Any object
   * @return String containing the class name
   */
  protected static getClassName(object: any): string {
    return object.constructor.name;
  }

  /**
   * Convert a number of bytes to a string
   * @param bytes Bytes, expressed as a `number` type
   * @return String containing the value, in megabytes
   */
  protected static memoryToString(bytes: number): string {
    const mb = (bytes / (1024 * 1024)).toFixed(2);
    return `${mb} MB`;
  }
}

/** Shorthand for the four core object types we track */
export type ModuleCoreObject = CoreCanvas2D | CoreCanvasWebGL | CoreShader | CoreTexture;

/** Enum for `onEngineObjectCreateDispose()` and `onCoreObjectCreateDispose()` */
export const enum ModuleCreateDispose {
  /** Object creation */
  Create = 'Create',

  /** Object disposal */
  Dispose = 'Dispose'
}

/** Enum for `onImageOperation()` */
export const enum ModuleImageOperation {
  /** Exporting or copying data from the image */
  Read = 'Read',

  /** Importing or rendering to the image */
  Write = 'Write'
}

/** Enum for `onImageOperation()`, and `reserveMemory()` */
export const enum ModuleImageFormat {
  /** 2D canvas */
  Canvas = 'Canvas',

  /** WebGL texture */
  Texture = 'Texture'
}

/** Enum for `onImageOperation()` */
export const enum ModuleOperationType {
  /** The operation was performed as an explicit operation invoked by the FIM library's client */
  Explicit = 'Explicit',

  /** The operation was performed as part of importing/exporting the image contents to/from a non-FIM format */
  ImportExport = 'ImportExport',

  /**
   * The operation was performed transparently as part of converting the image contents between two different internal
   * formats
   */
  InternalConversion = 'InternalConversion'
}
