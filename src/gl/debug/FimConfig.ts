// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { ConfigurationOptions, ConfigurationFlags, StorageType } from '@leosingleton/commonlibs';

/** Debugging options for FIM's WebGL support */
export class FimGLConfig extends ConfigurationOptions {
  private constructor() {
    super('fim_', ConfigurationFlags.AllowNonBrowsers);
    this.initialize();
  }

  /** Enables detailed logging messages to the JavaScript console */
  public readonly debugLoggingEnabled: boolean;

  /**
   * If set to a positive number, the render buffer is limited to the lower of this value or the GPU's stated
   * capabilities.
   */
  public readonly maxRenderBufferSize: number;

  /**
   * If set to a positive number, the texture size is limited to the lower of this value or the GPU's stated
   * capabilities.
   */
  public readonly maxTextureSize: number;

  /**
   * If set to a positive number, the texture bits per pixel is limited to the lower of this value or the GPU's stated
   * capabilities.
   */
  public readonly maxBpp: number;

  protected defaults: {[id: string]: [string, StorageType, any]} = {
    debugLoggingEnabled: ['log', StorageType.Session, false],
    maxRenderBufferSize: ['maxrbs', StorageType.Session, 0],
    maxTextureSize: ['maxtex', StorageType.Session, 0],
    maxBpp: ['maxbpp', StorageType.Session, 0]
  };

  /** Shared global instance */
  public static readonly config = new FimGLConfig();
}
