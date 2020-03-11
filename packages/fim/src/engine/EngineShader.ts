// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { EngineFim } from './EngineFim';
import { EngineImage } from './EngineImage';
import { EngineObject } from './EngineObject';
import { EngineObjectType } from './EngineObjectType';
import { FimReleaseResourcesFlags } from '../api/FimReleaseResourcesFlags';
import { FimShader } from '../api/FimShader';
import { CoreShader } from '../core/CoreShader';
import { GlslShader } from 'webpack-glsl-minify';

/** Internal implementation of the FimShader interface */
export class EngineShader extends EngineObject implements FimShader {
  /**
   * Constructor
   * @param fim Parent FIM engine instance
   * @param fragmentShader Fragment shader, created using webpack-glsl-minify
   * @param vertexShader Optional vertex shader, created using webpack-glsl-minify
   * @param shaderName Optional shader name, for debugging
   */
  public constructor(fim: EngineFim<EngineImage, EngineShader>, fragmentShader: GlslShader, vertexShader?: GlslShader,
      shaderName?: string) {
    super(EngineObjectType.Shader, shaderName, fim);
    this.fragmentShader = fragmentShader;
    this.vertexShader = vertexShader;
  }

  protected releaseOwnResources(flags: FimReleaseResourcesFlags): void {
    if (flags & FimReleaseResourcesFlags.WebGLShader) {
      if (this.shader) {
        this.shader.dispose();
        this.shader = undefined;
      }
    }
  }

  // Force parentObject to be a more specific type
  public parentObject: EngineFim<EngineImage, EngineShader>;

  /**
   * The underlying shader instance. May be undefined if the shader has not been used yet, or if the WebGL context was
   * lost and the shader needs to be recreated.
   */
  private shader: CoreShader;

  /** Source code for the fragment shader, created using webpack-glsl-minify */
  public readonly fragmentShader: GlslShader;

  /**
   * Source code for the vertex shader, created using webpack-glsl-minify. May be undefined to use the default vertex
   * shader built into the `CoreShader` constructor.
   */
  public readonly vertexShader?: GlslShader;

  public getCoreShader(): CoreShader {
    const me = this;
    me.ensureNotDisposedAndHasContext();

    if (!me.shader) {
      me.shader = new CoreShader(me.parentObject.getWebGLCanvas(), me.handle, me.fragmentShader, me.vertexShader);
    }

    return me.shader;
  }
}
