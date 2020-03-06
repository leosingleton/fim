// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { CoreCanvas } from '../CoreCanvas';
import { CoreCanvas2D } from '../CoreCanvas2D';
import { CoreCanvasWebGL, EventListenerType } from '../CoreCanvasWebGL';
import { CoreTexture } from '../CoreTexture';
import { RenderingContext2D } from '../types/RenderingContext2D';
import { RenderingContextWebGL } from '../types/RenderingContextWebGL';
import { FimEngineOptions } from '../../api/FimEngineOptions';
import { FimImageOptions } from '../../api/FimImageOptions';
import { FimDimensions } from '../../primitives/FimDimensions';
import { FimError, FimErrorCode } from '../../primitives/FimError';

/** Handle for mock instances */
const handle = 'MockUnitTest';

/** Large canvas size (1920x1080) */
const large = FimDimensions.fromWidthHeight(1920, 1080);

/** Throws a not implemented exception */
function notImplemented(): never {
  throw new FimError(FimErrorCode.NotImplemented);
}

/** Mock implementation of `CoreCanvas2D` */
class MockCanvas2D extends CoreCanvas2D {
  public constructor(dimensions: FimDimensions, handle: string, engineOptions?: FimEngineOptions,
      imageOptions?: FimImageOptions) {
    super(dimensions, handle, engineOptions, imageOptions);
  }

  protected getContext(): RenderingContext2D {
    notImplemented();
  }

  public loadFromPngAsync(_pngFile: Uint8Array, _allowRescale?: boolean): Promise<void> {
    notImplemented();
  }

  public loadFromJpegAsync(_jpegFile: Uint8Array, _allowRescale?: boolean): Promise<void> {
    notImplemented();
  }

  public exportToPngAsync(): Promise<Uint8Array> {
    notImplemented();
  }

  public exportToJpegAsync(_quality: number): Promise<Uint8Array> {
    notImplemented();
  }

  protected disposeSelf(): void {
  }

  public getImageSource(): CanvasImageSource {
    notImplemented();
  }

  protected createCanvas2D(canvasDimensions: FimDimensions, imageHandle: string, engineOptions: FimEngineOptions,
      imageOptions: FimImageOptions): CoreCanvas2D {
    return new MockCanvas2D(canvasDimensions, imageHandle, engineOptions, imageOptions);
  }
}

/** Mock implementation of `CoreCanvasWebGL` */
class MockCanvasWebGL extends CoreCanvasWebGL {
  public constructor(dimensions: FimDimensions, handle: string, engineOptions?: FimEngineOptions,
      imageOptions?: FimImageOptions) {
    super(dimensions, handle, engineOptions, imageOptions);
  }

  public getContext(): RenderingContextWebGL {
    notImplemented();
  }

  protected addCanvasEventListener(_type: EventListenerType, _listener: EventListenerObject, _options: boolean): void {
  }

  protected removeCanvasEventListener(_type: EventListenerType, _listener: EventListenerObject, _options: boolean):
      void {
  }

  protected createCoreTextureInternal(parent: CoreCanvasWebGL, handle: string, dimensions: FimDimensions,
      options: FimImageOptions): CoreTexture {
    return new MockTexture(parent, handle, dimensions, options);
  }

  protected disposeSelf(): void {
  }

  public getImageSource(): CanvasImageSource {
    notImplemented();
  }

  protected createCanvas2D(canvasDimensions: FimDimensions, imageHandle: string, engineOptions: FimEngineOptions,
      imageOptions: FimImageOptions): CoreCanvas2D {
    return new MockCanvas2D(canvasDimensions, imageHandle, engineOptions, imageOptions);
  }
}

/** Mock implementation of `CoreTexture` */
class MockTexture extends CoreTexture {
  protected copyFromInternal(_srcCanvas: CoreCanvas): void {
    notImplemented();
  }
}

describe('Mock Core classes', () => {

  it('Creates/disposes mock CoreCanvas2D', () => {
    const canvas = new MockCanvas2D(large, handle);
    canvas.dispose();
    expect(() => canvas.dispose()).toThrow(); // Double dispose throws exception
  });

  it('Creates/disposes mock CoreCanvasWebGL', () => {
    const canvas = new MockCanvasWebGL(large, handle);
    canvas.dispose();
    expect(() => canvas.dispose()).toThrow(); // Double dispose throws exception
  });

});
