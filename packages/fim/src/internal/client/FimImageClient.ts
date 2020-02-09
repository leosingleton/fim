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
import { CommandImageSetOptions } from '../commands/CommandImageSetOptions';
import { DispatcherOpcodes } from '../commands/DispatcherOpcodes';
import { Dispatcher } from '../dispatcher/Dispatcher';
import { DispatcherCommandBase } from '../dispatcher/DispatcherCommandBase';
import { deepEquals } from '@leosingleton/commonlibs';

/** Internal implementation of the FimImage interface */
export abstract class FimImageClient extends FimObjectClient implements FimImage {
  /**
   * Constructor
   * @param fim Parent FIM object
   * @param dispatcher Back-end FIM engine
   * @param dimensions Image dimensions
   * @param options Optional image options to override the parent FIM's defaults
   * @param objectName An optional name specified when creating the object to help with debugging
   */
  public constructor(fim: Fim<FimImageClient>, dispatcher: Dispatcher, imageDimensions: FimDimensions,
      options: FimImageOptions, objectName?: string) {
    super(dispatcher, FimObjectType.Image, fim.longHandle, objectName);
    this.fim = fim;
    this.imageDimensions = imageDimensions;
    this.imageOptions = options ?? {};
  }

  public readonly imageDimensions: FimDimensions;
  public imageOptions: FimImageOptions;

  /** Fills the image with a solid color */
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

  private fim: Fim<FimImageClient>;
}
