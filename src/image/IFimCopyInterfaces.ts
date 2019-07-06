// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimCanvas } from './FimCanvas';
import { FimGreyscaleBuffer } from './FimGreyscaleBuffer';
import { FimRgbaBuffer } from './FimRgbaBuffer';
import { FimRect } from '../primitives/FimRect';

export interface IFimCopyFromCanvas {
  copyFromCanvas(srcImage: FimCanvas, srcCoords?: FimRect, destCoords?: FimRect): void;
}

export interface IFimCopyFromGreyscaleBuffer {
  copyFromGreyscaleBuffer(srcImage: FimGreyscaleBuffer, srcCoords?: FimRect, destCoords?: FimRect): void;
}

export interface IFimCopyFromRgbaBuffer {
  copyFromRgbaBuffer(srcImage: FimRgbaBuffer, srcCoords?: FimRect, destCoords?: FimRect): void;
}

export interface IFimCopyFromRgbaBufferAsync {
  copyFromRgbaBufferAsync(srcImage: FimRgbaBuffer, srcCoords?: FimRect, destCoords?: FimRect): Promise<void>;
}

export interface IFimCopyToCanvas {
  copyToCanvas(destImage: FimCanvas, srcCoords?: FimRect, destCoords?: FimRect): void;
}

export interface IFimCopyToCanvasAsync {
  copyToCanvasAsync(destImage: FimCanvas, srcCoords?: FimRect, destCoords?: FimRect): Promise<void>;
}

export interface IFimCopyToGreyscaleBuffer {
  copyToGreyscaleBuffer(destImage: FimGreyscaleBuffer, srcCoords?: FimRect, destCoords?: FimRect): void;
}

export interface IFimCopyToRgbaBuffer {
  copyToRgbaBuffer(destImage: FimRgbaBuffer, srcCoords?: FimRect, destCoords?: FimRect): void;
}
