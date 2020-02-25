// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimNodeImage } from '../../api/FimNodeImage';
import { FimImageClient } from '@leosingleton/fim/internals';

/** Client implementation of the FimImage interface for running in Node.js */
export class FimNodeImageClient extends FimImageClient implements FimNodeImage {

}
