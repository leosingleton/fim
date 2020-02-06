// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FcCmd } from './FcCmd';
import { FimImageOptions } from '../../api/FimImageOptions';

/** Command to fill an image with a solid color */
export interface FcImageFillSolid extends FcCmd {
  cmd: 'ifs';

  /** Options for the destination image */
  destOptions: FimImageOptions;

  /** Color to fill */
  color: string;
}
