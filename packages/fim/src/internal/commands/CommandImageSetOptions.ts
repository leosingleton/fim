// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { DispatcherCommandBase } from '../dispatcher/DispatcherCommandBase';
import { FimImageOptions } from '../../api/FimImageOptions';

/** Updates the image options on a FIM image */
export interface CommandImageSetOptions extends DispatcherCommandBase {
  command: 'ImageSetOptions';

  /** Image options */
  imageOptions: FimImageOptions;
}
