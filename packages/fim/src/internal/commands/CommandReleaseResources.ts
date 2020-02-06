// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { CommandBase } from './CommandBase';
import { FimReleaseResourcesFlags } from '../../api/FimReleaseResourcesFlags';

/** Releases resources on a FIM object */
export interface CommandReleaseResources extends CommandBase {
  cmd: 'rr';

  /** Specifies which resources to release */
  flags: FimReleaseResourcesFlags;
}
