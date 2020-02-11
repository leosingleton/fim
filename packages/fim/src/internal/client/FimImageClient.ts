// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimObjectClient } from './FimObjectClient';
import { FimObjectType } from './FimObjectType';
import { Fim } from '../../api/Fim';
import { FimImage } from '../../api/FimImage';
import { FimImageOptions, mergeImageOptions } from '../../api/FimImageOptions';
import { FimColor } from '../../primitives/FimColor';
import { FimDimensions } from '../../primitives/FimDimensions';
import { CommandImageFillSolid } from '../commands/CommandImageFillSolid';
import { CommandImageGetPixel } from '../commands/CommandImageGetPixel';
import { CommandImageSetOptions } from '../commands/CommandImageSetOptions';
import { CommandImageSetPixel } from '../commands/CommandImageSetPixel';
import { DispatcherOpcodes } from '../commands/DispatcherOpcodes';
import { DispatcherClient } from '../dispatcher/DispatcherClient';
import { DispatcherCommandBase } from '../dispatcher/DispatcherCommandBase';
import { deepEquals } from '@leosingleton/commonlibs';

/** Internal implementation of the FimImage interface */
export abstract class FimImageClient extends FimObjectClient implements FimImage {
  /**
   * Constructor
   * @param fim Parent FIM object
   * @param dispatcherClient Client wrapper around the backend FIM engine
   * @param dimensions Image dimensions
   * @param options Optional image options to override the parent FIM's defaults
   * @param objectName An optional name specified when creating the object to help with debugging
   */
  public constructor(fim: Fim<FimImageClient>, dispatcherClient: DispatcherClient, imageDimensions: FimDimensions,
      options: FimImageOptions, objectName?: string) {
    super(dispatcherClient, FimObjectType.Image, fim.handle, objectName);
    this.fim = fim;
    this.imageDimensions = imageDimensions;
    this.imageOptions = options ?? {};
  }

  public readonly imageDimensions: FimDimensions;
  public readonly imageOptions: FimImageOptions;

  private fim: Fim<FimImageClient>;

  protected dispatchCommand(command: DispatcherCommandBase): void {
    // Check whether the executionOptions have changed. If so, update the backend rendering engine.
    const cur = mergeImageOptions(this.fim.defaultImageOptions, this.imageOptions);
    const prev = this.lastImageOptions;
    if (!prev || !deepEquals(cur, prev)) {
      const seoCommand: CommandImageSetOptions = {
        opcode: DispatcherOpcodes.ImageSetOptions,
        imageOptions: cur,
        optimizationHints: {
          canQueue: true
        }
      };
      super.dispatchCommand(seoCommand);
      this.lastImageOptions = cur;
    }

    super.dispatchCommand(command);
  }

  /** State of the merged imageOptions on the last call to dispatchCommand() */
  private lastImageOptions: FimImageOptions;

  public fillSolid(color: FimColor | string): void {
    // Force color to be a string
    const colorString = (typeof(color) === 'string') ? color : color.string;

    const command: CommandImageFillSolid = {
      opcode: DispatcherOpcodes.ImageFillSolid,
      color: colorString,
      optimizationHints: {
        canQueue: true,
        writeHandles: [this.handle]
      }
    };
    this.dispatchCommand(command);
  }

  public async getPixelAsync(x: number, y: number): Promise<FimColor> {
    const command: CommandImageGetPixel = {
      opcode: DispatcherOpcodes.ImageGetPixel,
      x,
      y,
      optimizationHints: {
        canQueue: false,
        readHandles: [this.handle]
      }
    };
    const colorString = await this.dispatchCommandAndWaitAsync(command);

    return FimColor.fromString(colorString);
  }

  public setPixel(x: number, y: number, color: string | FimColor): void {
    // Force color to be a string
    const colorString = (typeof(color) === 'string') ? color : color.string;

    const command: CommandImageSetPixel = {
      opcode: DispatcherOpcodes.ImageSetPixel,
      x,
      y,
      color: colorString,
      optimizationHints: {
        canQueue: true,
        writeHandles: [this.handle]
      }
    };
    this.dispatchCommand(command);
  }
}
