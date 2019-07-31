// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

/**
 * To render 2D graphics using a GPU, we generally render two triangles that make up the entire viewport. This class
 * contains the coordinates for these triangles.
 */
export class TwoTriangles {
  /** Vertex vectors (size 4) */
  public static readonly vertexPositions = [
    -1, -1,  0,  1,
     1, -1,  0,  1,
     1,  1,  0,  1,
    -1, -1,  0,  1,
    -1,  1,  0,  1,
     1,  1,  0,  1
  ];

  /** Texture coordinates (size 2) */
  public static readonly textureCoords = [
    0, 0,
    1, 0,
    1, 1,
    0, 0,
    0, 1,
    1, 1
  ];
}
