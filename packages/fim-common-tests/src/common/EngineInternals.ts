// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { Fim } from '@leosingleton/fim';
import { CoreCanvasWebGL } from '@leosingleton/fim/internals';

/** Helper functions for accessing the internals of the `Fim` class */
export namespace EngineInternals {
  /** Returns the `CoreCanvasWebGL` instance backing the FIM engine */
  export function getWebGLCanvas(fim: Fim): CoreCanvasWebGL {
    return (fim as any).glCanvas;
  }
}
