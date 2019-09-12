// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimGLTexture } from './FimGLTexture';
import { FimGLPreservedTexture } from './processor/FimGLPreservedTexture';
import { GlslVariable, GlslShader } from 'webpack-glsl-minify';

/** One uniform or const variable in a shader minified by webpack-glsl-minify, with the addition of its value */
export interface FimGLVariableDefinition extends GlslVariable {
  /** Sets the value of the const or uniform. Not set by the compiler. */
  variableValue?: number | number[] | Float32Array | FimGLTexture | FimGLPreservedTexture | boolean;
}

/** Map of original unminified names to their minified details */
export type FimGLVariableDefinitionMap = { [original: string]: FimGLVariableDefinition };

/** A minified shader created by webpack-glsl-minify, with the addition of values to consts and uniforms */
export interface FimGLShader extends GlslShader {
  uniforms: FimGLVariableDefinitionMap;
  consts: FimGLVariableDefinitionMap;
}
