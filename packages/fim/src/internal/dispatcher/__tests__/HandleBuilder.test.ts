// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { HandleBuilder } from '../HandleBuilder';

describe('HandleBuilder', () => {

  it('Constructs unique handles', () => {
    const h1 = HandleBuilder.createShortObjectHandle('MyObject');
    const h2 = HandleBuilder.createShortObjectHandle('MyObject');
    expect(h1 === h2).toBeFalsy();
  });

  it('Supports optional names', () => {
    const h1 = HandleBuilder.createShortObjectHandle('MyObject', 'Object1');
    const h2 = HandleBuilder.createShortObjectHandle('MyObject', 'Object2');
    expect(h1 === h2).toBeFalsy();
  });

  it('Implements getFirstShortHandle()', () => {
    const root = HandleBuilder.createShortObjectHandle('MyObject', 'Root');
    const child = HandleBuilder.createShortObjectHandle('MyObject', 'Child');
    const long = HandleBuilder.createObjectHandle(undefined, root, undefined, child); // Undefined are ignored

    expect(HandleBuilder.getFirstShortHandle(long)).toEqual(root);
    expect(HandleBuilder.getFirstShortHandle(child)).toEqual(child);
    expect(HandleBuilder.getFirstShortHandle(undefined)).toEqual(undefined);
  });

  it('Implements parseAfter()', () => {
    const root = HandleBuilder.createShortObjectHandle('MyObject', 'Root');
    const child = HandleBuilder.createShortObjectHandle('MyObject', 'Child');
    const long = HandleBuilder.createObjectHandle(root, undefined, child, undefined); // Undefined are ignored

    expect(HandleBuilder.parseAfter(long, root)).toEqual(child);
    expect(HandleBuilder.parseAfter(long, child)).toBeUndefined();
    expect(HandleBuilder.parseAfter(long, undefined)).toEqual(root);
    expect(() => HandleBuilder.parseAfter(long, 'SomethingElse')).toThrow();
  });

});
