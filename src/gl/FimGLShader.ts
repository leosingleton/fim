// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimGLPreservedTexture } from './FimGLPreservedTexture';
import { FimGLTexture } from './FimGLTexture';

// This file contains the output of a compiled GLSL shader. Definitions must be kept in sync with the
// webpack-glsl-minify source code.

/** One uniform or const variable in a shader minified by webpack-glsl-minify */
export interface FimGLVariableDefinition {
  /** Variable type, e.g. 'vec3' or 'float' */
  variableType: string;

  /** Minified variable name */
  variableName: string;

  /** Sets the value of the const or uniform. Not set by the compiler. */
  variableValue?: number | number[] | Float32Array | FimGLTexture | FimGLPreservedTexture | boolean;
}

/** Map of original unminified names to their minified details */
export type FimGLVariableDefinitionMap = { [original: string]: FimGLVariableDefinition };

/** Output of the GLSL Minifier */
export interface FimGLShader {
  /** Minified GLSL code */
  sourceCode: string;

  /** Uniform variable names. Maps the original unminified name to its minified details. */
  uniforms: FimGLVariableDefinitionMap;

  /** Constant variables. Maps the original unminified name to the substitution value. */
  consts: FimGLVariableDefinitionMap;
}
