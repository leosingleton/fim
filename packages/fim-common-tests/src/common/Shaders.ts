// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { GlslShader } from 'webpack-glsl-minify';

/** Sample WebGL shader to copy a texture to the output */
export const copyShader = require('../glsl/Copy.glsl.js') as GlslShader;

/** Sample WebGL shader to fill with a solid shade of grey specified by a constant */
export const fillConstShader = require('../glsl/FillConst.glsl.js') as GlslShader;

/** Sample WebGL shader to fill with a solid color specified by a constant */
export const fillUniformShader = require('../glsl/FillUniform.glsl.js') as GlslShader;
