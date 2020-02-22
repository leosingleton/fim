// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimError, FimErrorCode } from '../FimError';

describe('FimError', () => {

  it('Builds from a collection of 1', () => {
    const err = new FimError(FimErrorCode.NoWebGL);
    const collection = FimError.fromCollection([err]);
    expect(collection.code).toEqual(FimErrorCode.NoWebGL);
  });

  it('Builds from a collection of 2', () => {
    const err1 = new FimError(FimErrorCode.NoWebGL); // Most severe
    const err2 = new FimError(FimErrorCode.InvalidHandle);
    const collection = FimError.fromCollection([err1, err2]);
    expect(collection.code).toEqual(FimErrorCode.NoWebGL);
  });

  it('Builds from a non-FimError', () => {
    const err = new RangeError('My range error');
    const fimErr = FimError.fromError(err);
    expect(fimErr.code).toEqual(FimErrorCode.NonFimError);
  });

  it('Throws a collection', () => {
    const err = new FimError(FimErrorCode.NoWebGL);
    expect(() => FimError.throwCollection([err])).toThrow();
  });

  it('Does not throw an empty collection', () => {
    const collection: FimError[] = [];
    FimError.throwCollection(collection);
  });

});
