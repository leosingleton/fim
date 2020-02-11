// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { NodeDispatcherOpcodes } from './NodeDispatcherOpcodes';
import { FimDimensions } from '@leosingleton/fim';
import { DispatcherCommandBase } from '@leosingleton/fim/internals';

/** Command to create a new image by short handle */
export interface CommandNodeCreateImage extends DispatcherCommandBase {
  opcode: NodeDispatcherOpcodes.CreateImage;

  /** Short handle for the new image */
  imageShortHandle: string;

  /** Image dimensions */
  imageDimensions: FimDimensions;
}
