// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { RenderingContextLike } from './RenderingContextLike';
import { WebGLRenderingContextLike } from './WebGLRenderingContextLike';

/** The core set of properties that FIM uses on HtmlCanvasElement, OffscreenCanvas, and any other canvas-like objects */
export interface CanvasLike {
  /**
   * dispose() it not part of the built-in browser objects. It is expected that it gets added to the underlying canvas
   * object when it is constructed.
   */
  dispose(): void;

  height: number;
  width: number;
  getContext(contextId: '2d', contextAttributes?: CanvasRenderingContext2DSettings): RenderingContextLike | null;
  getContext(contextId: 'webgl', contextAttributes?: WebGLContextAttributes): WebGLRenderingContextLike | null;
}
