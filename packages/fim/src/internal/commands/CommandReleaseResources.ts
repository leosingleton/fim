// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { DispatcherCommandBase } from '../dispatcher/DispatcherCommandBase';
import { DispatcherOpcodes } from './DispatcherOpcodes';
import { FimReleaseResourcesFlags } from '../../api/FimReleaseResourcesFlags';

/** Releases resources on a FIM object */
export interface CommandReleaseResources extends DispatcherCommandBase {
  opcode: DispatcherOpcodes.ReleaseResourcs;

  /** Specifies which resources to release */
  flags: FimReleaseResourcesFlags;
}
