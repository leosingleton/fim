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

  it('Implements getShortHandle()', () => {
    const root = HandleBuilder.createShortObjectHandle('MyObject', 'Root');
    const child = HandleBuilder.createShortObjectHandle('MyObject', 'Child');
    const long = HandleBuilder.createObjectHandle(root, undefined, child); // Undefined are ignored

    expect(HandleBuilder.getShortHandle(long)).toEqual(child);
    expect(HandleBuilder.getShortHandle(child)).toEqual(child);
    expect(HandleBuilder.getShortHandle(undefined)).toEqual(undefined);
  });

  it('Implements getHandleAtPosition()', () => {
    const root = HandleBuilder.createShortObjectHandle('MyObject', 'Root');
    const child = HandleBuilder.createShortObjectHandle('MyObject', 'Child');
    const long = HandleBuilder.createObjectHandle(undefined, root, undefined, child); // Undefined are ignored

    expect(HandleBuilder.getHandleAtPosition(long, 0)).toEqual(root);
    expect(HandleBuilder.getHandleAtPosition(long, 1)).toEqual(long);
    expect(HandleBuilder.getHandleAtPosition(long, 2)).toEqual(undefined);
    expect(HandleBuilder.getHandleAtPosition(child, 0)).toEqual(child);
    expect(HandleBuilder.getHandleAtPosition(child, 1)).toEqual(undefined);
    expect(HandleBuilder.getHandleAtPosition(undefined, 0)).toEqual(undefined);
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
