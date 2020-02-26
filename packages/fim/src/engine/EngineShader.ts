// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { EngineObject } from './EngineObject';
import { FimReleaseResourcesFlags } from '../api/FimReleaseResourcesFlags';
import { FimShader } from '../api/FimShader';
import { FimError, FimErrorCode } from '../primitives/FimError';

/** Internal implementation of the FimShader interface */
export class EngineShader extends EngineObject implements FimShader {
  protected releaseOwnResources(_flags: FimReleaseResourcesFlags): void {
    throw new FimError(FimErrorCode.NotImplemented);
  }
}
