// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimBrowserImage } from '../../api/FimBrowserImage';
import { FimImageClient } from '@leosingleton/fim/internals';

/** Client implementation of the FimImage interface for running in web browsers */
export class FimBrowserImageClient extends FimImageClient implements FimBrowserImage {
}
