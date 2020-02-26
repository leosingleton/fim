// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { EngineFim } from './EngineFim';
import { EngineObject } from './EngineObject';
import { EngineObjectType } from './EngineObjectType';
import { EngineShader } from './EngineShader';
import { FimEngineOptions } from '../api/FimEngineOptions';
import { FimImage } from '../api/FimImage';
import { FimImageOptions, mergeImageOptions } from '../api/FimImageOptions';
import { FimColor } from '../primitives/FimColor';
import { FimDimensions } from '../primitives/FimDimensions';
import { FimError, FimErrorCode } from '../primitives/FimError';
import { CoreCanvas2D } from '../core/CoreCanvas2D';
import { CoreTexture } from '../core/CoreTexture';

/** Internal implementation of the FimImage interface */
export abstract class EngineImage extends EngineObject implements FimImage {
  /**
   * Constructor
   * @param fim Parent FIM object
   * @param dimensions Image dimensions
   * @param options Optional image options to override the parent FIM's defaults
   * @param objectName An optional name specified when creating the object to help with debugging
   */
  public constructor(fim: EngineFim<EngineImage, EngineShader>, dimensions: FimDimensions, options?: FimImageOptions,
      objectName?: string) {
    super(EngineObjectType.Image, objectName, fim);
    this.imageDimensions = dimensions;
    this.imageOptions = options ?? {};
  }

  public readonly imageDimensions: FimDimensions;
  public readonly imageOptions: FimImageOptions;

  // Force parentObject to be a more specific type
  public parentObject: EngineFim<EngineImage, EngineShader>;

  /** Calculates and returns the current FIM engine options */
  public getEngineOptions(): FimEngineOptions {
    return this.parentObject.engineOptions;
  }

  /** Calculates and returns the current image options for this image */
  public getImageOptions(): FimImageOptions {
    return mergeImageOptions(this.parentObject.defaultImageOptions, this.imageOptions);
  }

  //
  // Internally, the image contents has three different representations:
  //  - A solid fill color
  //  - A DOM canvas / OffscreenCanvas
  //  - A WebGL texture
  //
  // At any time, anywhere between zero and three may be set and the rest undefined. If multiple values are set, it is
  // safe to assume that the values are equivalent.
  //
  private contentFillColor: FimColor;
  private contentCanvas: CoreCanvas2D;
  private contentTexture: CoreTexture;

  public fillSolid(color: FimColor | string): void {
    this.ensureNotDisposed();

    // Force color to be a FimColor
    color = (typeof(color) !== 'string') ? color : FimColor.fromString(color);

    this.contentFillColor = color;
    this.contentCanvas = undefined;
    this.contentTexture = undefined;
  }

  public async getPixelAsync(_x: number, _y: number): Promise<FimColor> {
    this.ensureNotDisposed();

    if (this.contentFillColor) {
      return this.contentFillColor;
    }

    // TODO: copy GL to canvas and read a pixel
    throw new FimError(FimErrorCode.NotImplemented);
  }

  public loadPixelData(pixelData: Uint8Array): void {
    this.ensureNotDisposed();

    // Validate the array size matches the expected dimensions
    const dim = this.imageDimensions;
    const expectedLength = dim.getArea() * 4;
    if (pixelData.length !== expectedLength) {
      throw new FimError(FimErrorCode.InvalidDimensions, `Expected ${dim}`);
    }

    throw new FimError(FimErrorCode.NotImplemented);
  }
}
