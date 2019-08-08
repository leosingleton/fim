// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { ConfigurationOptions, ConfigurationFlags, StorageType } from '@leosingleton/commonlibs';

/** Debugging options for FIM */
export class FimConfig extends ConfigurationOptions {
  private constructor() {
    super('fim_', ConfigurationFlags.AllowNonBrowsers);
    this.initialize();
  }

  /** Enables detailed logging messages to the JavaScript console */
  public readonly debugLoggingEnabled: boolean;

  /**
   * If set to a positive number, the WebGL render buffer is limited to the lower of this value or the GPU's stated
   * capabilities.
   */
  public readonly maxGLRenderBufferSize: number;

  /**
   * If set to a positive number, the WebGL texture size is limited to the lower of this value or the GPU's stated
   * capabilities.
   */
  public readonly maxGLTextureSize: number;

  /**
   * If set to a positive number, the WebGL texture bits per pixel is limited to the lower of this value or the GPU's
   * stated capabilities.
   */
  public readonly maxGLBpp: number;

  protected defaults: {[id: string]: [string, StorageType, any]} = {
    debugLoggingEnabled: ['log', StorageType.Session, false],
    maxGLRenderBufferSize: ['maxrbs', StorageType.Session, 0],
    maxGLTextureSize: ['maxtex', StorageType.Session, 0],
    maxGLBpp: ['maxbpp', StorageType.Session, 0]
  };

  /** Shared global instance */
  public static readonly config = new FimConfig();
}
