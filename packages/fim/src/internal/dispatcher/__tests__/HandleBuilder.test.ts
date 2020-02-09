// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { HandleBuilder } from '../HandleBuilder';

describe('HandleBuilder', () => {

  it('Constructs unique handles', () => {
    const h1 = HandleBuilder.createObjectHandle('MyObject');
    const h2 = HandleBuilder.createObjectHandle('MyObject');
    expect(h1 === h2).toBeFalsy();
  });

  it('Supports optional names', () => {
    const h1 = HandleBuilder.createObjectHandle('MyObject', 'Object1');
    const h2 = HandleBuilder.createObjectHandle('MyObject', 'Object2');
    expect(h1 === h2).toBeFalsy();
  });

  it('Creates and parses long object handles', () => {
    const root = HandleBuilder.createObjectHandle('MyObject', 'Root');
    const child = HandleBuilder.createObjectHandle('MyObject', 'Child');
    const long = HandleBuilder.createLongObjectHandle(undefined, root, undefined, child); // Undefined are ignored

    const parsed1 = HandleBuilder.parseLongObjectHandle(long);
    expect(parsed1.rootHandle).toEqual(root);
    expect(parsed1.longHandle).toEqual(child);

    const parsed2 = HandleBuilder.parseLongObjectHandle(child);
    expect(parsed2.rootHandle).toEqual(child);
    expect(parsed2.longHandle).toBeUndefined();
  });

});