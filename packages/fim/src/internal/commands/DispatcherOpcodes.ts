// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

/** String values used in the DispatcherCommand.opcode property */
export enum DispatcherOpcodes {
  BeginExecution = 'BeginExecution',
  Dispose = 'Dispose',
  ImageFillSolid = 'ImageFillSolid',
  ImageSetOptions = 'ImageSetOptions',
  ReleaseResourcs = 'ReleaseResources',
  SetExecutionOptions = 'SetExecutionOptions'
}