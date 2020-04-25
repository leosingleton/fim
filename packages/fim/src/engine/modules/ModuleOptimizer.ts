// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { ModuleBase, ModuleImageFormat } from './ModuleBase';
import { FimError, FimErrorCode } from '../../primitives/FimError';

/** Base class for all optimizers. Optimizer implementations are contained in the `optimizers/` subfolder. */
export abstract class ModuleOptimizer extends ModuleBase {
  /**
   * Called before the engine allocates memory, so the optimizer can ensure adequate memory is available.
   * @param memory Amount of memory to allocate, in bytes
   * @param format Format of the memory, canvas or texture
   * @throws `FimError(FimErrorCode.OutOfMemory)` if the memory allocation will cause FIM to exceed the limit set in
   *    `engineOptions.maxCanvasMemory`
   */
  public reserveMemory(memory: number, format: ModuleImageFormat): void {
    const fim = this.fim;

    let errorCode: FimErrorCode;  // Error code to throw if limit exceeded
    let current: number;          // Current memory usage, in bytes
    let limit: number;            // Memory limit, in bytes
    switch (format) {
      case ModuleImageFormat.Canvas:
        errorCode = FimErrorCode.OutOfMemory;
        current = fim.resources.totals.canvasMemory;
        limit = fim.engineOptions.maxCanvasMemory;
        break;

      case ModuleImageFormat.Texture:
        errorCode = FimErrorCode.WebGLOutOfMemory;
        current = fim.resources.totals.glMemory;
        limit = fim.engineOptions.maxGLMemory;
        break;

      default:
        FimError.throwOnUnreachableCodeValue(format);
    }

    if (limit && current + memory > limit) {
      const lim = ModuleOptimizer.memoryToString(limit);
      const cur = ModuleOptimizer.memoryToString(current);
      const req = ModuleOptimizer.memoryToString(memory);
      throw new FimError(errorCode, `Exceeded ${lim} ${format} limit. Cur=${cur} Req=${req}`);
    }
  }

  /**
   * Called to give the optimizer a chance to release resources. The optimizer should go through the list of engine
   * objects which it is tracking, and call `releaseResources()` on any objects it decides should be released.
   */
  public abstract releaseResources(): void;
}
