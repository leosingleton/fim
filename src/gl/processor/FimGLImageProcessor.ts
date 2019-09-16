// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimGLPreservedTexture } from './FimGLPreservedTexture';
import { FimGLTexturePool } from './FimGLTexturePool';
import { FimGLCanvas } from '../FimGLCanvas';
import { FimGLProgram } from '../FimGLProgram';
import { FimGLTextureOptions } from '../FimGLTexture';
import { IFim } from '../../Fim';
import { FimRect } from '../../primitives/FimRect';
import { IFimDimensions } from '../../primitives/IFimDimensions';
import { IDisposable, DisposableSet } from '@leosingleton/commonlibs';

/**
 * Base class for writing code that processes a series of 2D images. Caches programs and temporary textures. Handles
 * disposing objects when the context is lost.
 */
export abstract class FimGLImageProcessor implements IDisposable, IFimDimensions {
  /**
   * Constructor
   * @param fim FIM canvas factory
   * @param maxWidth Maximum width of the output or textures, whichever is largest, in pixels
   * @param maxHeight Maximum height of the output or textures, whichever is largest, in pixels
   */
  public constructor(fim: IFim, maxWidth: number, maxHeight: number) {
    this.w = maxWidth;
    this.h = maxHeight;
    this.imageDimensions = FimRect.fromWidthHeight(maxWidth, maxHeight);

    let glCanvas = this.glCanvas = new FimGLCanvas(fim, maxWidth, maxHeight);

    this.disposeOnLostContext = new DisposableSet();
    this.disposeOnDispose = new DisposableSet();
    this.programs = {};
    this.temporaryTextures = new FimGLTexturePool(glCanvas);
    this.preservedTextures = {};

    // Register for context lost notifications
    glCanvas.registerForContextLost(() => this.onLostContext());
  }

  // IFimDimensions implementation
  public readonly w: number;
  public readonly h: number;
  public readonly imageDimensions: FimRect;
  
  public dispose(): void {
    this.glCanvas.dispose();
    this.disposeOnDispose.dispose();
    this.onLostContext();
  }

  private onLostContext(): void {
    this.disposeOnLostContext.dispose();
    this.programs = {};

    this.temporaryTextures.dispose();
    this.temporaryTextures = new FimGLTexturePool(this.glCanvas);
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
  protected temporaryTextures: FimGLTexturePool;

  /** Cache of preserved WebGL textures, indexed by a texture ID number */
  private preservedTextures: { [textureId: number]: FimGLPreservedTexture };
}
