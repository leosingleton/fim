// src/fim/GLShader.ts
// Fast Image Manipulation Library
// Copyright 2016-2018 Leo C. Singleton IV <leo@leosingleton.com>

import { FimGLTexture } from './GLTexture';

// This file contains the output of a compiled GLSL shader. Definitions must be kept in sync with the
// webpack-glsl-minify source code.

export interface FimGLVariableDefinition {
  /** Variable type, e.g. 'vec3' or 'float' */
  variableType: string;

  /** Minified variable name */
  variableName: string;

  /** Sets the value of the const or uniform. Not set by the compiler. */
  variableValue?: number | number[] | Float32Array | FimGLTexture | boolean;
}

/** Map of original unminified names to their minified details */
export type FimGLVariableDefinitionMap = { [original: string]: FimGLVariableDefinition };

/** Output of the GLSL Minifier */
export interface FimGLShader {
  /** Minified GLSL code */
  sourceCode: string;

  /** Uniform variable names. Maps the original unminified name to its minified details. */
  uniforms: FimGLVariableDefinitionMap;

  /** Constant variables. Maps the orignal unminified name to the substitution value. */
  consts: FimGLVariableDefinitionMap;
}
