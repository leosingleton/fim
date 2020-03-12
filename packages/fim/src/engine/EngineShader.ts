// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { EngineFim } from './EngineFim';
import { EngineImage } from './EngineImage';
import { EngineObject } from './EngineObject';
import { EngineObjectType } from './EngineObjectType';
import { LruQueue } from './types/LruQueue';
import { FimReleaseResourcesFlags } from '../api/FimReleaseResourcesFlags';
import { FimShader } from '../api/FimShader';
import { FimValue } from '../api/FimValue';
import { CoreShader } from '../core/CoreShader';
import { CoreTexture } from '../core/CoreTexture';
import { CoreValue } from '../core/CoreValue';
import { FimTransform2D } from '../math/FimTransform2D';
import { FimTransform3D } from '../math/FimTransform3D';
import { FimError } from '../primitives/FimError';
import { FimRect } from '../primitives/FimRect';
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
      for (const hash in this.shaders) {
        this.shaders[hash].dispose();
      }
      this.shaders = {};
    }
  }

  // Force parentObject to be a more specific type
  public parentObject: EngineFim<EngineImage, EngineShader>;

  /**
   * The underlying shader instances. This is a hash table, indexed by `JSON.stringify(this.constantValues)`, as the
   * shaders must be compiled for each unique set of constants. Shaders are compiled on first use so may not be
   * present here on the first call, after WebGL context is lost, or if the shader was automatically disposed to free
   * resources.
   */
  private shaders: { [constantValues: string]: CoreShader } = {};

  /** LRU queue of the keys to the `shader` table */
  private constantValuesLru = new LruQueue<string>();

  /** Source code for the fragment shader, created using webpack-glsl-minify */
  public readonly fragmentShader: GlslShader;

  /**
   * Source code for the vertex shader, created using webpack-glsl-minify. May be undefined to use the default vertex
   * shader built into the `CoreShader` constructor.
   */
  public readonly vertexShader?: GlslShader;

  public setConstant(name: string, value: number): void {
    // Ensure the constant name is valid
    if (!this.fragmentShader.consts[name]) {
      FimError.throwOnInvalidParameter(name);
    }

    this.constantValues[name] = value;
  }

  public setConstants(values: { [name: string]: number }): void {
    for (const name in values) {
      this.setConstant(name, values[name]);
    }
  }

  /** Constant values */
  private constantValues: { [name: string]: number } = {};

  public setUniform(name: string, value: FimValue): void {
    // Ensure the uniform name is valid
    if (!this.fragmentShader.uniforms[name]) {
      FimError.throwOnInvalidParameter(name);
    }

    this.uniformValues[name] = value;
  }

  public setUniforms(values: { [name: string]: FimValue }): void {
    for (const name in values) {
      this.setUniform(name, values[name]);
    }
  }

  /** Uniform values */
  private uniformValues: { [name: string]: FimValue } = {};

  public setVertices(vertexPositions?: number[], textureCoords?: number[]): void {
    this.vertexPositions = vertexPositions;
    this.textureCoords = textureCoords;
    this.vertexMatrix = undefined;
  }

  public applyVertexMatrix(vertexMatrix: FimTransform2D | FimTransform3D | number[]): void {
    this.vertexPositions = undefined;
    this.textureCoords = undefined;
    this.vertexMatrix = vertexMatrix;
  }

  /**
   * Vertex position array to pass to `CoreShader.setVertices()`. If this value is set, then `vertexMatrix` should be
   * `undefined`.
   */
  private vertexPositions?: number[];

  /**
   * Texture coordinates array to pass to `CoreShader.setVertices()`. If this value is set, then `vertexMatrix` should
   * be `undefined`.
   */
  private textureCoords?: number[];

  /**
   * Vertex matrix to pass to `CoreShader.applyVertexMatrix()`. If this value is set, then `vertexPositions` and
   * `textureCoords` should be `undefined`.
   */
  private vertexMatrix?: FimTransform2D | FimTransform3D | number[];

  /**
   * Executes a program. Callers must first set the constant and uniform values before calling this method.
   * @param outputTexture Destination texture to render to. If unspecified, the output is rendered to the parent
   *    CoreCanvasWebGL.
   * @param destCoords If set, renders the output to the specified destination coordinates using WebGL's viewport and
   *    scissor operations. By default, the destination is the full texture or canvas. Note that the coordinates use
   *    the top-left as the origin, to be consistent with 2D canvases, despite WebGL typically using bottom-left.
   */
  public async executeAsync(outputTexture?: CoreTexture, destCoords?: FimRect): Promise<void> {
    const me = this;
    me.ensureNotDisposedAndHasContext();

    // Allocate the shader, or reuse an existing instance if it is already compiled
    const cv = JSON.stringify(me.constantValues);
    let shader = me.shaders[cv];
    if (!shader) {
      // Create a new shader, set the constants, and compile it. We explicitly compile the program to catch any compiler
      // errors here before caching, rather than letting CoreShader automatically compile on first use.
      shader = new CoreShader(me.parentObject.getWebGLCanvas(), me.handle, me.fragmentShader, me.vertexShader);
      shader.setConstants(me.constantValues);
      shader.compileProgram();

      // Cache the shader for future calls
      me.shaders[cv] = shader;

      // Limit the number of cached shaders. If needed, free the LRU.
      me.constantValuesLru.enqueue(cv);
      if (me.constantValuesLru.getCount() > me.parentObject.engineOptions.shaderInstanceLimit) {
        const lruCv = me.constantValuesLru.dequeue();
        me.shaders[lruCv].dispose();
        delete me.shaders[lruCv];
      }
    }

    // Transform the uniform values from FimUniformValue to CoreValue. The types are the same except for textures.
    const uniformValues: { [name: string]: CoreValue } = {};
    for (const name in me.uniformValues) {
      const value = me.uniformValues[name];
      const type = me.fragmentShader.uniforms[name].variableType;
      if (type.indexOf('sampler') !== -1) {
        // value is an EngineImage instance
        const image = value as EngineImage;
        const texture = await image.populateContentTexture();
        uniformValues[name] = texture;
      } else {
        // value is a constant
        uniformValues[name] = value as CoreValue;
      }
    }
    shader.setUniforms(uniformValues);

    // Set the vertices for the vertex shader
    if (me.vertexMatrix) {
      shader.applyVertexMatrix(me.vertexMatrix);
    } else {
      shader.setVertices(me.vertexPositions, me.textureCoords);
    }

    // Execute the shader
    shader.execute(outputTexture, destCoords);
  }
}
