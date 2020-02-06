// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FcCmd } from './FcCmd';

/** Disposes a FIM object */
export interface FcDispose extends FcCmd {
  cmd: 'd';
}
