// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

/** The core set of properties that FIM uses on CanvasRenderingContext2D or similar interfaces */
export interface RenderingContext2D extends Pick<CanvasRenderingContext2D,
    'globalAlpha' | 'imageSmoothingEnabled' | 'fillRect' | 'fillStyle' | 'restore' | 'save'> {
  // This is a very clunky, but the interfaces exposed by headless-gl and node-canvas don't match TypeScript's DOM
  // definitions exactly.

  createImageData(sw: number, sh: number, settings?: ImageDataSettings): FimImageData;
  createImageData(imagedata: FimImageData): FimImageData;
  getImageData(sx: number, sy: number, sw: number, sh: number, settings?: ImageDataSettings): FimImageData;
  putImageData(imagedata: FimImageData, dx: number, dy: number): void;
  putImageData(imagedata: FimImageData, dx: number, dy: number, dirtyX: number, dirtyY: number, dirtyWidth: number, dirtyHeight: number): void;

  drawImage(image: FimCanvasImageSource, dx: number, dy: number): void;
  drawImage(image: FimCanvasImageSource, dx: number, dy: number, dw: number, dh: number): void;
  drawImage(image: FimCanvasImageSource, sx: number, sy: number, sw: number, sh: number, dx: number, dy: number, dw: number, dh: number): void;

  globalCompositeOperation: GlobalCompositeOperation | 'clear' | 'destination' | 'normal' | 'saturate';
}

interface FimImageData extends Pick<ImageData, 'data'> {
}

interface FimCanvasImageSource {//extends Pick<CanvasImageSource, ''> {
}
