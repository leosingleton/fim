// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimObject } from '../../api/FimObject';
import { FimReleaseResourcesFlags } from '../../api/FimReleaseResourcesFlags';
import { CommandDispose } from '../commands/CommandDispose';
import { CommandReleaseResources } from '../commands/CommandReleaseResources';
import { DispatcherClient } from '../dispatcher/DispatcherClient';
import { DispatcherCommandBase } from '../dispatcher/DispatcherCommandBase';
import { HandleBuilder } from '../dispatcher/HandleBuilder';
import { DispatcherOpcodes } from '../commands/DispatcherOpcodes';

/** Base class for all objects in the FIM API */
export abstract class FimObjectClient implements FimObject {
  /**
   * Base constructor for all objects in the FIM API
   * @param dispatcherClient Client wrapper around the backend FIM engine
   * @param objectType A short string indicating the object type, e.g. 'img' for FimImage
   * @param parentLongHandle Long handle of the parent object. Required if the object has a parent; may be undefined if
   *    this object is the root.
   * @param objectName Optional name specified when creating the object to help with debugging
   */
  protected constructor(dispatcherClient: DispatcherClient, objectType: string, parentLongHandle?: string,
      objectName?: string) {
    // Create a globally-unique handle name
    this.shortHandle = HandleBuilder.createShortObjectHandle(objectType, objectName);
    this.longHandle = HandleBuilder.createLongObjectHandle(parentLongHandle, this.shortHandle);

    this.dispatcherClient = dispatcherClient;
  }

  public readonly shortHandle: string;
  public readonly longHandle: string;

  /** Back-end FIM engine */
  protected dispatcherClient: DispatcherClient;

  public releaseResources(flags: FimReleaseResourcesFlags): void {
    const command: CommandReleaseResources = {
      opcode: DispatcherOpcodes.ReleaseResources,
      flags,
      optimizationHints: {
        canQueue: true
      }
    };
    this.dispatchCommand(command);
  }

  public releaseAllResources(): void {
    this.releaseResources(FimReleaseResourcesFlags.All);
  }

  public dispose(): void {
    const command: CommandDispose = {
      opcode: DispatcherOpcodes.Dispose,
      optimizationHints: {
        canQueue: true
      }
    };
    this.dispatchCommand(command);

    this.dispatcherClient = undefined;
  }

  /**
   * Dispatches a command to the back-end rendering engine
   * @param command Command to dispatch
   */
  protected dispatchCommand(command: DispatcherCommandBase): void {
    this.dispatcherClient.dispatchCommand(this.longHandle, command);
  }

  /**
   * Dispatches a command to the back-end rendering engine and blocks until it completes
   * @param command Command to dispatch
   * @returns Result of the command
   */
  protected dispatchCommandAndWaitAsync(command: DispatcherCommandBase): Promise<any> {
    return this.dispatcherClient.dispatchCommandAndWaitAsync(this.longHandle, command);
  }
}
