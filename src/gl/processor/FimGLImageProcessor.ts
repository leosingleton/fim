// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimGLPreservedTexture } from './FimGLPreservedTexture';
import { FimGLTemporaryTexture } from './FimGLTemporaryTexture';
import { FimGLCanvas } from '../FimGLCanvas';
import { FimGLProgram } from '../FimGLProgram';
import { FimGLTexture, FimGLTextureOptions } from '../FimGLTexture';
import { IDisposable, DisposableSet } from '@leosingleton/commonlibs';

/**
 * Base class for writing code that processes a series of 2D images. Caches programs and temporary textures. Handles
 * disposing objects when the context is lost.
 */
export abstract class FimGLImageProcessor implements IDisposable {
  /**
   * Constructor
   * @param maxWidth Maximum width of the output or textures, whichever is largest, in pixels
   * @param maxHeight Maximum height of the output or textures, whichever is largest, in pixels
   */
  public constructor(maxWidth: number, maxHeight: number) {
    let glCanvas = this.glCanvas = new FimGLCanvas(maxWidth, maxHeight);

    this.disposeOnLostContext = new DisposableSet();
    this.disposeOnDispose = new DisposableSet();
    this.programs = {};
    this.temporaryTextures = {};
    this.preservedTextures = {};

    // Register for context lost notifications
    glCanvas.registerForContextLost(() => this.onLostContext());
  }

  public dispose(): void {
    this.glCanvas.dispose();
    this.disposeOnDispose.dispose();
    this.onLostContext();
  }

  private onLostContext(): void {
    this.disposeOnLostContext.dispose();
    this.programs = {};
    this.temporaryTextures = {};
  }

  /**
   * Returns a WebGL program. Allocates the program on the first call, then caches the value by programID for
   * subsequent calls. FimGLImageProcessor handles the disposing of programs--the caller _SHOULD NOT_ call dispose() on
   * the returned program.
   * @param programId A unique number identifying the program. Image processors should create an enum to assign a
   *    unique ID to each program.
   * @param createProgram Lambda function to create the program when needed. This should call the FimGLProgram's
   *    constructor with the required parameters.
   */
  protected getProgram<T extends FimGLProgram>(programId: number, createProgram: (glCanvas: FimGLCanvas) => T): T {
    let programs = this.programs;

    // Check the program cache
    let p = programs[programId];
    if (!p) {
      // The program was not found in the cache. Create it.
      p = this.disposeOnLostContext.addDisposable(createProgram(this.glCanvas));
      programs[programId] = p;
    }

    return p as T;
  }

  /**
   * Creates a WebGL texture that is only used for a short time. Its contents may be lost on a WebGL context lost
   * event, or it may be overwritten by another user of temporary textures. The caller is responsible for calling
   * dispose() to indicate when it is done using the temporary texture.
   * @param width Texture width, in pixels. Defaults to the width of the FimGLCanvas if not specified.
   * @param height Texture height, in pixels. Defaults to the width of the FimGLCanvas if not specified.
   * @param options See FimGLTextureOptions
   */
  protected getTemporaryTexture(width?: number, height?: number, options?: FimGLTextureOptions): FimGLTexture {
    let glCanvas = this.glCanvas;
    let temporaryTextures = this.temporaryTextures;

    // Get a unique string describing the texture options and check the cache
    let textureDescription = FimGLTexture.describe(glCanvas, width, height, options);
    let t1 = temporaryTextures[textureDescription];
    if (!t1) {
      // This is the first request for these texture parameters. Create a new array in the cache and fall through
      // below.
      t1 = temporaryTextures[textureDescription] = [];
    } else if (t1.length > 0) {
      // Texture of the right parameters was found in the cache. Return it.
      return t1.pop();
    }

    // No matching textures were found in the cache. Allocate a new texture.
    let t2 = new FimGLTemporaryTexture(() => {
      t1.push(t2); // Return the texture to the cache on dispose()
    }, glCanvas, width, height, options);

    // Custom disposer to actually dispose the texture on lost context
    this.disposeOnLostContext.addNonDisposable(t2, t3 => t3.realDispose());

    return t2;
  }

  /**
   * Returns a WebGL texture that is preserved across lost context. Allocates the texture on the first call, then
   * caches the value by textureID for subsequent calls. FimGLImageProcessor handles the disposing of preserved
   * textures--the caller _SHOULD NOT_ call dispose() on the returned texture.
   * @param textureId A unique number identifying the texture. Image processors should create an enum to assign a
   *    unique ID to each texture.
   * @param width Texture width, in pixels. Defaults to the width of the FimGLCanvas if not specified.
   * @param height Texture height, in pixels. Defaults to the width of the FimGLCanvas if not specified.
   * @param options See FimGLTextureOptions
   */
  protected getPreservedTexture(textureId: number, width?: number, height?: number,
      options?: FimGLTextureOptions): FimGLPreservedTexture {
    let preservedTextures = this.preservedTextures;

    // Check the texture cache
    let t = preservedTextures[textureId];
    if (!t) {
      // The texture was not found in the cache. Create it.
      t = this.disposeOnDispose.addDisposable(new FimGLPreservedTexture(this.glCanvas, width, height, options));
      preservedTextures[textureId] = t;
    }

    return t;
  }

  /** The WebGL canvas to use for rendering */
  protected readonly glCanvas: FimGLCanvas;

  /** Objects added to this set are automatically disposed whenever the WebGL context is lost */
  protected readonly disposeOnLostContext: DisposableSet;

  /** Objects added to this set are automatically disposed when the FimGLImageProcessor is disposed */
  protected readonly disposeOnDispose: DisposableSet;

  /** Cache of WebGL programs, indexed by a program ID number */
  private programs: { [programId: number]: FimGLProgram };

  /** Cache of temporary WebGL textures, indexed by FimGLTexture.describe() strings */
  private temporaryTextures: { [textureDescription: string]: FimGLTemporaryTexture[] };

  /** Cache of preserved WebGL textures, indexed by a texture ID number */
  private preservedTextures: { [textureId: number]: FimGLPreservedTexture };
}
