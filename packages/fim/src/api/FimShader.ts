// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimObject } from './FimObject';
import { FimValue } from './FimValue';
import { FimTransform2D } from '../math/FimTransform2D';
import { FimTransform3D } from '../math/FimTransform3D';

/** Represents a WebGL fragment shader in the FIM library */
export interface FimShader extends FimObject {
  /**
   * Sets the value of a constant
   * @param name Name of the constant
   * @param value Value of the constant
   */
  setConstant(name: string, value: number): void;

  /**
   * Sets the value of multiple constants
   * @param values A dictionary of name-value pairs
   */
  setConstants(values: { [name: string]: number }): void;

  /**
   * Sets the value of a uniform
   * @param name Name of the uniform
   * @param value Value of the uniform
   */
  setUniform(name: string, value: FimValue): void;

  /**
   * Sets the value of multiple uniforms
   * @param values A dictionary of name-value pairs
   */
  setUniforms(values: { [name: string]: FimValue }): void;

  /**
   * Updates the vertices. By default, we draw two triangles filling the entire rendering area.
   * @param vertexPositions Vertex positions as an array of vec4 values
   * @param textureCoords Texture coordinates for each vertex as an array of vec2 values
   */
  setVertices(vertexPositions?: number[], textureCoords?: number[]): void;

  /**
   * Updates the vertices by taking the standard two triangles vertices and applying a matrix transformation.
   * @param vertexMatrix 3x3 or 4x4 matrix used to manipulate vertices. The Transform2D and Transform3D
   *    classes can help to create the vertex transformation matrices.
   */
  applyVertexMatrix(vertexMatrix: FimTransform2D | FimTransform3D | number[]): void;
}
