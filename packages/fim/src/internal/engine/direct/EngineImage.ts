// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { EngineFim } from './EngineFim';
import { EngineObject } from './EngineObject';
import { FimExecutionOptions } from '../../../api/FimExecutionOptions';
import { FimImageOptions, defaultImageOptions } from '../../../api/FimImageOptions';
import { FimColor } from '../../../primitives/FimColor';
import { FimDimensions } from '../../../primitives/FimDimensions';
import { FimError, FimErrorCode } from '../../../primitives/FimError';
import { CoreCanvas2D } from '../core/CoreCanvas2D';
import { CoreCanvasWebGL } from '../core/CoreCanvasWebGL';
import { CommandImageFillSolid } from '../../commands/CommandImageFillSolid';
import { DispatcherOpcodes } from '../../commands/DispatcherOpcodes';
import { CommandImageGetPixel } from '../../commands/CommandImageGetPixel';
import { CommandImageLoadPixelData } from '../../commands/CommandImageLoadPixelData';
import { CommandImageSetOptions } from '../../commands/CommandImageSetOptions';
import { DispatcherCommand } from '../../dispatcher/DispatcherCommand';
import { deepCopy } from '@leosingleton/commonlibs';

/** Backend instance of an image */
export abstract class EngineImage extends EngineObject {
  /**
   * Constructor
   * @param shortHandle Short handle of the new image object
   * @param fim Parent FIM instance
   * @param imageDimensions Image dimensions
   */
  public constructor(shortHandle: string, fim: EngineFim<EngineImage>, imageDimensions: FimDimensions) {
    super(shortHandle, fim);
    this.imageDimensions = imageDimensions;

    // Initialize the image options to defaults. We will use these until we receive a SetImageOptions command.
    this.imageOptions = deepCopy(defaultImageOptions);

    // Inherit execution options from the parent EngineFim. The parent class will update the property values on the
    // same readonly instance.
    this.executionOptions = fim.executionOptions;
  }

  /** Image dimensions */
  public readonly imageDimensions: FimDimensions;

  /** Options for the FIM execution engine */
  public readonly executionOptions: FimExecutionOptions;

  /** Image options */
  public readonly imageOptions: FimImageOptions;

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
  private contentGLTexture: CoreCanvasWebGL;

  public executeCommand(command: DispatcherCommand): any {
    switch (command.opcode) {
      case DispatcherOpcodes.ImageFillSolid:
        return this.commandFillSolid(command as any as CommandImageFillSolid);

      case DispatcherOpcodes.ImageGetPixel:
        return this.commandGetPixel(command as any as CommandImageGetPixel);

      case DispatcherOpcodes.ImageLoadPixelData:
        return this.commandLoadPixelData(command as any as CommandImageLoadPixelData);

      case DispatcherOpcodes.ImageSetOptions:
        return this.commandSetOptions(command as any as CommandImageSetOptions);

      default:
        return super.executeCommand(command);
    }
  }

  private commandFillSolid(command: CommandImageFillSolid): void {
    this.contentFillColor = FimColor.fromString(command.color);
    this.contentCanvas = undefined;
    this.contentGLTexture = undefined;
  }

  private commandGetPixel(_command: CommandImageGetPixel): string {
    if (this.contentFillColor) {
      return this.contentFillColor.string;
    }

    // TODO: copy GL to canvas and read a pixel
    throw new FimError(FimErrorCode.NotImplemented);
  }

  private commandLoadPixelData(_command: CommandImageLoadPixelData): void {
    throw new FimError(FimErrorCode.NotImplemented);
  }

  private commandSetOptions(command: CommandImageSetOptions): void {
    // The imageOptions property is readonly so other objects may create a reference to it. In order to update it, we
    // can't create a new object, and instead must do a property-by-property copy of the values.
    EngineObject.cloneProperties(this.imageOptions, command.imageOptions);
  }
}
