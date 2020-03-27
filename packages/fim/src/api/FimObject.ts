// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { Fim } from './Fim';
import { FimReleaseResourcesFlags } from './FimReleaseResourcesFlags';

/** Templated version of the `FimObject` interface which supports specific implementations of root and child classes */
export interface FimObject {
  /** Unique string describing the type of the object */
  readonly objectType: string;

  /** Handle including the full path from parent to child objects */
  readonly handle: string;

  /** Array of references to child objects */
  readonly childObjects: FimObject[];

  /** Parent object. `undefined` for the root object. */
  readonly parentObject?: FimObject;

  /** Root object. Points to `this` for the root object. */
  readonly rootObject: Fim;

  /**
   * Classes that implement `FimObject` have a parent-child relationship tracked in the `childObjects`, `parentObject`,
   * and `rootObject` properties. These properties are read-only and should not be manipulated directly--instead, call
   * `reparent()` to do so.
   *
   * An object may be "adopted" by and other object that shares the same `rootObject`. Registering a child object causes
   * the parent FIM object to forward any `releaseResources()`, `releaseAllResources()`, and `dispose()` calls.
   *
   * A child may have either one or zero parents. Calling this method without a parameter removes any existing parent
   * relationship. Child objects should call this method if they are disposed prior to the disposal of the parent FIM
   * object.
   *
   * @param parent New parent object. `undefined` to remove an existing parent.
   */
  reparent(parent?: FimObject): void;

  /**
   * Registers a child object, which causes the parent FIM instance to forward any `releaseResources()`,
   * `releaseAllResources()`, and `dispose()` calls.
   *
   * This method is generally called by the implementation of `reparent()` and should not be called directly.
   *
   * @param child Child object to receive notifications
   */
  addChild(child: FimObject): void;

  /**
   * Stops sending calls to a child object previously registered with `addChild()`. Child objects should call this
   * method if they are disposed prior to the disposal of their parent object.
   *
   * This method is generally called by the implementation of `dispose()` and should not be called directly.
   *
   * @param child Child object to stop receiving notifications
   */
  removeChild(child: FimObject): void;

  /**
   * Releases memory and/or GPU resources.
   *
   * Unlike dispose(), releaseResources() may be called any number of times, and the object is still good for use after
   * releasing resources--it just must be reinitialized with new data.
   *
   * @param flags Specifies which resources to release
   */
  releaseResources(flags: FimReleaseResourcesFlags): void;

  /** Equivalent to releaseResources(FimReleaseResourcesFlags.All) */
  releaseAllResources(): void;

  /**
   * Completely disposes all memory and GPU resources.
   *
   * Once disposed, the object may no longer be used whatsoever. Any calls to methods or even dispose() multiple times
   * on the same object will result in a FimError exception of type AppError.
   */
  dispose(): void;
}
