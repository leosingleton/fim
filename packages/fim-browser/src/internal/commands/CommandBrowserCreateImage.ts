// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { BrowserDispatcherOpcodes } from './BrowserDispatcherOpcodes';
import { FimDimensions } from '@leosingleton/fim';
import { DispatcherCommandBase } from '@leosingleton/fim/internals';

/** Command to create a new image by handle */
export interface CommandBrowserCreateImage extends DispatcherCommandBase {
  opcode: BrowserDispatcherOpcodes.CreateImage;

  /** Handle for the new image */
  imageHandle: string;

  /** Image dimensions */
  imageDimensions: FimDimensions;
}