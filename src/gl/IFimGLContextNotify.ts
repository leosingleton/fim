// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

/** Interface for WebGL objects that receive notifications when the WebGL context is lost or restored */
export interface IFimGLContextNotify {
  /** WebGL context was lost */
  onContextLost(): void;

  /** WebGL context was restored */
  onContextRestored(): void;
}
