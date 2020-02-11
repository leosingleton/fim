// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { CoreCanvas } from './CoreCanvas';
import { RenderingContextWebGL } from './types/RenderingContextWebGL';

/** Wrapper around the HTML canvas and canvas-like objects */
export abstract class CoreCanvasWebGL extends CoreCanvas {
  /** Derived classes must override this method to call canvas.getContext('webgl') */
  protected abstract getContext(): RenderingContextWebGL;
}
