// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { EngineFim } from './EngineFim';
import { EngineImage } from './EngineImage';
import { EngineObject } from './EngineObject';
import { EngineObjectType } from './EngineObjectType';
import { FimReleaseResourcesFlags } from '../api/FimReleaseResourcesFlags';
import { FimShader } from '../api/FimShader';
import { FimError, FimErrorCode } from '../primitives/FimError';
import { GlslShader } from 'webpack-glsl-minify';

/** Internal implementation of the FimShader interface */
export class EngineShader extends EngineObject implements FimShader {
  public constructor(fim: EngineFim<EngineImage, EngineShader>, _fragmentShader: GlslShader, _vertexShader?: GlslShader,
      shaderName?: string) {
    super(EngineObjectType.Shader, shaderName, fim);
  }

  protected releaseOwnResources(_flags: FimReleaseResourcesFlags): void {
    throw new FimError(FimErrorCode.NotImplemented);
  }
}
