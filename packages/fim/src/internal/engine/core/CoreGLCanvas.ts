// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { CanvasLike } from './CanvasLike';
import { CoreCanvas } from './CoreCanvas';

/** Wrapper around the WebGL canvas and canvas-like objects */
export abstract class CoreGLCanvas<TCanvasLike extends CanvasLike> extends CoreCanvas<TCanvasLike> {

}
