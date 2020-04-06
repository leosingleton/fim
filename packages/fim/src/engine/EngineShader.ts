// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { EngineImage } from './EngineImage';
import { EngineObject } from './EngineObject';
import { EngineObjectType } from './EngineObjectType';
import { FimObject } from '../api/FimObject';
import { FimReleaseResourcesFlags } from '../api/FimReleaseResourcesFlags';
import { FimShader } from '../api/FimShader';
import { FimValue } from '../api/FimValue';
import { CoreCanvasWebGL } from '../core/CoreCanvasWebGL';
import { CoreShader } from '../core/CoreShader';
import { CoreTexture } from '../core/CoreTexture';
import { CoreValue } from '../core/CoreValue';
import { FimTransform2D } from '../math/FimTransform2D';
import { FimTransform3D } from '../math/FimTransform3D';
import { FimError } from '../primitives/FimError';
import { FimRect } from '../primitives/FimRect';
import { LruQueue } from '@leosingleton/commonlibs';
import { GlslShader } from 'webpack-glsl-minify';

/** Internal implementation of the FimShader interface */
export class EngineShader extends EngineObject implements FimShader {
  /**
   * Constructor
   * @param parent Parent object
   * @param fragmentShader Fragment shader, created using webpack-glsl-minify
   * @param vertexShader Optional vertex shader, created using webpack-glsl-minify
   * @param name Optional shader name, for debugging
   */
  public constructor(parent: FimObject, fragmentShader: GlslShader, vertexShader?: GlslShader, name?: string) {
    super(EngineObjectType.Shader, name, parent);
    this.fragmentShader = fragmentShader;
    this.vertexShader = vertexShader;

    this.rootObject.optimizer.recordShaderCreate(this);
  }

  public dispose(): void {
    this.rootObject.optimizer.recordShaderDispose(this);
    super.dispose();
  }

  protected releaseOwnResources(flags: FimReleaseResourcesFlags): void {
    const me = this;

    if (flags & FimReleaseResourcesFlags.WebGLShader) {
      for (const hash in me.shaders) {
        me.rootObject.resources.recordDispose(me, me.shaders[hash]);
        me.shaders[hash].dispose();
      }
      me.shaders = {};
    }
  }

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
    const me = this;
    me.vertexPositions = vertexPositions;
    me.textureCoords = textureCoords;
    me.vertexMatrix = undefined;
    me.verticesSet = true;
  }

  public applyVertexMatrix(vertexMatrix: FimTransform2D | FimTransform3D | number[]): void {
    const me = this;
    me.vertexPositions = undefined;
    me.textureCoords = undefined;
    me.vertexMatrix = vertexMatrix;
    me.verticesSet = true;
  }

  /**
   * Returns `true` if either the vertex position array or texture coordinates array has been changed from its default
   * (Two Triangles) values
   */
  public hasNonDefaultVertices(): boolean {
    return this.verticesSet;
  }

  /** Vertex position array to pass to `CoreShader.setVertices()` */
  private vertexPositions?: number[];

  /** Texture coordinates array to pass to `CoreShader.setVertices()` */
  private textureCoords?: number[];

  /**
   * Vertex matrix to pass to `CoreShader.applyVertexMatrix()`. If this value is set, then `vertexPositions` and
   * `textureCoords` should be `undefined`.
   */
  private vertexMatrix?: FimTransform2D | FimTransform3D | number[];

  /** Set on a call to `setVertices()` or `applyVertexMatrix()` */
  private verticesSet = false;

  /**
   * Executes a program. Callers must first set the constant and uniform values before calling this method.
   * @param glCanvas The `CoreCanvasWebGL` instance
   * @param outputTexture Destination texture to render to. If unspecified, the output is rendered to `glCanvas`.
   * @param destCoords If set, renders the output to the specified destination coordinates using WebGL's viewport and
   *    scissor operations. By default, the destination is the full texture or canvas. Note that the coordinates use
   *    the top-left as the origin, to be consistent with 2D canvases, despite WebGL typically using bottom-left.
   */
  public async executeAsync(glCanvas: CoreCanvasWebGL, outputTexture?: CoreTexture, destCoords?: FimRect):
      Promise<void> {
    const me = this;
    const root = me.rootObject;
    me.ensureNotDisposedAndHasContext();

    // Allocate the shader, or reuse an existing instance if it is already compiled
    const cv = JSON.stringify(me.constantValues);
    let shader = me.shaders[cv];
    if (!shader) {
      // Create a new shader, set the constants, and compile it. We explicitly compile the program to catch any compiler
      // errors here before caching, rather than letting CoreShader automatically compile on first use.
      shader = new CoreShader(glCanvas, me.handle, me.fragmentShader, me.vertexShader);
      shader.setConstants(me.constantValues);
      shader.compileProgram();

      // Record the shader creation
      root.resources.recordCreate(me, shader);

      // Cache the shader for future calls
      me.shaders[cv] = shader;

      // Limit the number of cached shaders. If needed, free the LRU.
      me.constantValuesLru.enqueue(cv);
      if (me.constantValuesLru.getCount() > root.engineOptions.shaderInstanceLimit) {
        const lruCv = me.constantValuesLru.dequeue();

        // Dispose the shader
        root.resources.recordDispose(me, me.shaders[lruCv]);
        me.shaders[lruCv].dispose();
        delete me.shaders[lruCv];
      }
    } else {
      // If the shader is already allocated, simply update its position in the LRU queue
      me.constantValuesLru.enqueue(cv);
    }

    // Transform the uniform values from FimUniformValue to CoreValue. The types are the same except for textures.
    const uniformValues: { [name: string]: CoreValue } = {};
    for (const name in me.uniformValues) {
      const value = me.uniformValues[name];
      const type = me.fragmentShader.uniforms[name].variableType;
      if (type.indexOf('sampler') !== -1) {
        // value is an EngineImage instance
        const image = value as EngineImage;
        const texture = await image.populateContentTextureAsync();
        uniformValues[name] = texture;
      } else {
        // value is a constant
        uniformValues[name] = value as CoreValue;
      }
    }
    shader.setUniforms(uniformValues);

    // Set the vertices for the vertex shader
    if (me.verticesSet) {
      if (me.vertexMatrix) {
        shader.applyVertexMatrix(me.vertexMatrix);
      } else {
        shader.setVertices(me.vertexPositions, me.textureCoords);
      }
    }

    // Execute the shader
    shader.execute(outputTexture, destCoords);
  }

  /**
   * Searches all uniforms and returns whether any contain the specified `EngineImage` instance. Used by
   * `EngineImage.executeAsync()` to detect the scenario where a single image is both an input and an output.
   * @param image `EngineImage` instance to search for
   */
  public uniformsContainEngineImage(image: EngineImage): boolean {
    for (const name in this.uniformValues) {
      const value = this.uniformValues[name];
      if (value === image) {
        return true;
      }
    }

    return false;
  }
}
