// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { EngineFim } from './EngineFim';
import { EngineObject } from './EngineObject';
import { FimImageOptions, defaultImageOptions } from '../../../api/FimImageOptions';
import { FimDimensions } from '../../../primitives/FimDimensions';
import { FimColor } from '../../../primitives/FimColor';
import { CommandImageFillSolid } from '../../commands/CommandImageFillSolid';
import { DispatcherOpcodes } from '../../commands/DispatcherOpcodes';
import { CommandImageGetPixel } from '../../commands/CommandImageGetPixel';
import { CommandImageSetOptions } from '../../commands/CommandImageSetOptions';
import { CommandImageSetPixel } from '../../commands/CommandImageSetPixel';
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
  }

  /** Image dimensions */
  public readonly imageDimensions: FimDimensions;

  /** Image options */
  public imageOptions: FimImageOptions;

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
  private contentCanvas: any;
  private contentGLTexture: any;

  public executeCommand(command: DispatcherCommand): any {
    switch (command.opcode) {
      case DispatcherOpcodes.ImageFillSolid:
        return this.commandFillSolid(command as any as CommandImageFillSolid);

      case DispatcherOpcodes.ImageGetPixel:
        return this.commandGetPixel(command as any as CommandImageGetPixel);

      case DispatcherOpcodes.ImageSetOptions:
        return this.commandSetOptions(command as any as CommandImageSetOptions);

      case DispatcherOpcodes.ImageSetPixel:
        return this.commandSetPixel(command as any as CommandImageSetPixel);

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
    throw new Error('not implemented');
  }

  private commandSetOptions(command: CommandImageSetOptions): void {
    this.imageOptions = command.imageOptions;
  }

  private commandSetPixel(_command: CommandImageSetPixel): void {
    throw new Error('not implemented');
  }
}
