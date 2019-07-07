// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { Transform2D } from '../Transform2D';

describe('Transform2D', () => {

  it('Initializes to an identity matrix', () => {
    let mat1 = new Transform2D();
    mat1.transform(mat1);

    let mat2 = new Transform2D();
    expect(mat1.value).toEqual(mat2.value);
  });

  it('Multiplies by the identity matrix', () => {
    let mat1 = [1, 2, 3, 4, 5, 6, 7, 8, 9];

    // Multiply by the identity matrix
    let mat2 = new Transform2D(mat1);
    mat2.transform(new Transform2D());

    expect(mat2.value).toEqual(mat1);
  });
});
