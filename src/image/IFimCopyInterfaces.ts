// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimCanvas } from './FimCanvas';
import { FimRgbaBuffer } from './FimRgbaBuffer';
import { FimRect } from '../primitives/FimRect';

export interface IFimCopyFromCanvas {
  copyFromCanvas(srcImage: FimCanvas, srcCoords?: FimRect, destCoords?: FimRect): void;
}

export interface IFimCopyFromRgbaBuffer {
  copyFromRgbaBufferAsync(srcImage: FimRgbaBuffer, srcCoords?: FimRect, destCoords?: FimRect): void;
}

export interface IFimCopyFromRgbaBufferAsync {
  copyFromRgbaBufferAsync(srcImage: FimRgbaBuffer, srcCoords?: FimRect, destCoords?: FimRect): Promise<void>;
}
