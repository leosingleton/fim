// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { ModuleOptimizer } from '../ModuleOptimizer';
import { EngineImage } from '../../EngineImage';
import { EngineObject } from '../../EngineObject';
import { EngineShader } from '../../EngineShader';
import { ModuleCoreObject, ModuleCreateDispose, ModuleImageFormat, ModuleImageOperation,
  ModuleOperationType } from '../ModuleBase';

/**
 * Optimizer implementation which does no optimizations. It could be considered a "speed-optimized" implementation, in
 * that it never frees any memory, so is the fastest when there are no memory constraints.
 */
export class OptimizerNull extends ModuleOptimizer {
  public onEngineObjectCreateDispose(_object: EngineObject, _operation: ModuleCreateDispose): void {
    // Do nothing. The null optimizer never releases resources.
  }

  public onCoreObjectCreateDispose(_parent: EngineObject, _object: ModuleCoreObject, _operation: ModuleCreateDispose):
      void {
    // Do nothing. The null optimizer never releases resources.
  }

  public onImageOperation(_image: EngineImage, _format: ModuleImageFormat, _type: ModuleOperationType,
      _operation: ModuleImageOperation): void {
    // Do nothing. The null optimizer never releases resources.
  }

  public onShaderExecution(_shader: EngineShader, _executionTime: number, _megaPixels: number): void {
    // Do nothing. The null optimizer never releases resources.
  }

  public releaseResources(): void {
    // Do nothing. The null optimizer never releases resources.
  }
}
