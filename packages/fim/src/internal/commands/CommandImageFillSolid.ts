// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { DispatcherCommandBase } from '../dispatcher/DispatcherCommandBase';

/** Command to fill an image with a solid color */
export interface CommandImageFillSolid extends DispatcherCommandBase {
  command: 'ImageFillSolid';

  /** Color to fill */
  color: string;
}
