// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { DispatcherOpcodes } from './DispatcherOpcodes';
import { DispatcherCommandBase } from '../dispatcher/DispatcherCommandBase';
import { FimDimensions } from '../../primitives/FimDimensions';

/** Command to create a new image by short handle */
export interface CommandCreateImage extends DispatcherCommandBase {
  opcode: DispatcherOpcodes.CreateImage;

  /** Short handle for the new image */
  imageShortHandle: string;

  /** Image dimensions */
  imageDimensions: FimDimensions;
}
