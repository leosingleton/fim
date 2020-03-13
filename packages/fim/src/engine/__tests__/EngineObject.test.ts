// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { EngineObject } from '../EngineObject';
import { EngineObjectType } from '../EngineObjectType';
import { FimReleaseResourcesFlags } from '../../api/FimReleaseResourcesFlags';

class MyObject extends EngineObject {
  public constructor(objectName?: string, parent?: MyObject) {
    super(EngineObjectType.Fim, objectName, parent);
  }

  public resources = 'Expensive Stuff';

  protected releaseOwnResources(_flags: FimReleaseResourcesFlags): void {
    delete this.resources;
  }

  protected onContextLost(): void {
  }
}

describe('EngineObject', () => {

  it('Releases resources', () => {
    const o = new MyObject('Handle');
    o.releaseResources(FimReleaseResourcesFlags.All);
    expect(o.resources).toBeUndefined();
  });

  it('Maintains parent/child relationships', () => {
    const parent = new MyObject('Parent');
    const child = new MyObject('Child', parent);
    expect(child.parentObject).toBe(parent);
    expect(parent.childObjects.indexOf(child)).toBeGreaterThanOrEqual(0);
  });

  it('Recursively releases resources', () => {
    const parent = new MyObject('Parent');
    const child = new MyObject('Child', parent);

    // Release resources
    parent.releaseResources(FimReleaseResourcesFlags.All);
    expect(parent.resources).toBeUndefined();
    expect(child.resources).toBeUndefined();

    // Child handle is still valid
    expect(parent.childObjects.indexOf(child)).toBeGreaterThanOrEqual(0);
  });

  it('Recursively disposes', () => {
    const parent = new MyObject('Parent');
    const child = new MyObject('Child', parent);

    // Dispose
    parent.dispose();
    expect(parent.resources).toBeUndefined();
    expect(child.resources).toBeUndefined();

    // Child is no longer referenced from parent
    expect(parent.childObjects.indexOf(child)).toEqual(-1);
  });

});
