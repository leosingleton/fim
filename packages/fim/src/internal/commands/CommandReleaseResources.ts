// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FcCmd } from './FcCmd';
import { FimReleaseResourcesFlags } from '../../api/FimReleaseResourcesFlags';

/** Releases resources on a FIM object */
export interface FcReleaseResources extends FcCmd {
  cmd: 'rr';

  /** Specifies which resources to release */
  flags: FimReleaseResourcesFlags;
}
