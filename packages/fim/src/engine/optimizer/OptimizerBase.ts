// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { ImageFormat } from './ImageFormat';
import { memoryToString } from './Logging';
import { EngineFim } from '../EngineFim';
import { EngineImage } from '../EngineImage';
import { EngineShader } from '../EngineShader';
import { FimError, FimErrorCode } from '../../primitives/FimError';
import { OperationType } from './OperationType';

/**
 * Base class for implementing optimizations. Performs basic logging of events, which derived classes should call
 * their `super` counterparts in any overridden implementations.
 */
export abstract class OptimizerBase {
  /**
   * Constructor
   * @param fim Parent FIM engine
   */
  public constructor(fim: EngineFim) {
    this.fim = fim;
  }

  /** Parent FIM engine */
  private readonly fim: EngineFim;

  /**
   * Notification when an `EngineImage` instance is created
   * @param image `EngineImage` instance
   */
  public recordImageCreate(image: EngineImage): void {
    this.writeTrace('Create', image);
  }

  /**
   * Notification when an `EngineImage` instance is read from
   * @param image `EngineImage` instance
   * @param format Format of the image contents, canvas or texture
   * @param type Type of operation that triggered the activity
   */
  public recordImageRead(image: EngineImage, format: ImageFormat, type: OperationType): void {
    this.writeTrace('Read', image, format, type);
    this.fim.executionStats.recordImageRead(image, format, type);
  }

  /**
   * Notification when an `EngineImage` instance is written to
   * @param image `EngineImage` instance
   * @param format Format of the image contents, canvas or texture
   * @param type Type of operation that triggered the activity
   */
  public recordImageWrite(image: EngineImage, format: ImageFormat, type: OperationType): void {
    this.writeTrace('Write', image, format, type);
    this.fim.executionStats.recordImageWrite(image, format, type);
  }

  /**
   * Notification when an `EngineImage` instance is disposed
   * @param image `EngineImage` instance
   */
  public recordImageDispose(image: EngineImage): void {
    this.writeTrace('Dispose', image);
  }

  /**
   * Notification when an `EngineShader` instance is created
   * @param image `EngineShader` instance
   */
  public recordShaderCreate(shader: EngineShader): void {
    this.writeTrace('Create', shader);
  }

  /**
   * Notification when an `EngineShader` instance is used for execution
   * @param image `EngineShader` instance
   */
  public recordShaderUsage(shader: EngineShader): void {
    this.writeTrace('Use', shader);
    this.fim.executionStats.recordShaderUsage(shader);
  }

  /**
   * Notification when an `EngineShader` instance is disposed
   * @param image `EngineShader` instance
   */
  public recordShaderDispose(shader: EngineShader): void {
    this.writeTrace('Dispose', shader);
  }

  /**
   * Internal helper used by `recordXYZ()` to write trace messages
   * @param event String describing the event, i.e. 'Create'
   * @param object Object instance involved in the event
   * @param format For read/write operations, specifies the format of the image contents, canvas or texture
   * @param type For read/write operations, specifies the type of operation that triggered the activity
   */
  private writeTrace(event: string, object: EngineImage | EngineShader, format?: ImageFormat, type?: OperationType):
      void {
    if (this.fim.engineOptions.showTracing) {
      if (format === ImageFormat.Canvas) {
        event += ' Canvas';
      } else if (format === ImageFormat.Texture) {
        event += ' Texture';
      }

      if (type === OperationType.Explicit) {
        event += ' Explicit';
      } else if (type === OperationType.ImportExport) {
        event += ' ImportExport';
      } else if (type === OperationType.InternalConversion) {
        event += ' Conversion';
      }

      this.fim.writeTrace(object, event);
    }
  }

  /**
   * Called before the engine allocates canvas memory, so the optimizer can ensure adequate memory is available.
   * @param memory Amount of memory to allocate, in bytes
   * @throws `FimError(FimErrorCode.OutOfMemory)` if the memory allocation will cause FIM to exceed the limit set in
   *    `engineOptions.maxCanvasMemory`
   */
  public reserveCanvasMemory(memory: number): void {
    this.reserveMemoryInternal('Canvas', FimErrorCode.OutOfMemory, this.fim.resources.totals.canvasMemory, memory,
      this.fim.engineOptions.maxCanvasMemory);
  }

  /**
   * Called before the engine allocates WebGL texture memory, so the optimizer can ensure adequate memory is available.
   * @param memory Amount of memory to allocate, in bytes
   * @throws `FimError(FimErrorCode.WebGLOutOfMemory)` if the memory allocation will cause FIM to exceed the limit set
   *    in `engineOptions.maxGLMemory`
   */
  public reserveGLMemory(memory: number): void {
    this.reserveMemoryInternal('WebGL', FimErrorCode.WebGLOutOfMemory, this.fim.resources.totals.glMemory, memory,
      this.fim.engineOptions.maxGLMemory);
  }

  /**
   * Internal implementation of `reserveNonGLMemory()` and `reserveGLMemory()`
   * @param type String describining the type of memory, 'Canvas' or 'WebGL'
   * @param errorCode Error code to throw if there is not enough memory
   * @param current Current memory usage, in bytes
   * @param memory Amount of memory to allocate, in bytes
   * @param limit Limit specified in `engineOptions`, in bytes
   */
  private reserveMemoryInternal(type: 'Canvas' | 'WebGL', errorCode: FimErrorCode, current: number, memory: number,
      limit: number): void {
    if (limit && current + memory > limit) {
      const lim = memoryToString(limit);
      const cur = memoryToString(current);
      const req = memoryToString(memory);
      throw new FimError(errorCode, `Exceeded ${lim} ${type} limit. Cur=${cur} Req=${req}`);
    }
  }

  /**
   * Called to give the optimizer a chance to release resources. The optimizer should go through the list of engine
   * objects which it is tracking, and call `releaseResources()` on any objects it decides should be released.
   */
  public abstract releaseResources(): void;
}
