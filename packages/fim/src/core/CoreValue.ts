// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { CoreTexture } from './CoreTexture';

/** Variable value for a WebGL shader */
export type CoreValue = number | number[] | Float32Array | boolean | CoreTexture;
