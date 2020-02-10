// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

/** String values used in the DispatcherCommand.opcode property */
export enum DispatcherOpcodes {
  BeginExecution = 'BeginExecution',
  Create = 'Create',
  CreateImage = 'CreateImage',
  Dispose = 'Dispose',
  ImageFillSolid = 'ImageFillSolid',
  ImageGetPixel = 'ImageGetPixel',
  ImageSetOptions = 'ImageSetOptions',
  ImageSetPixel = 'ImageSetPixel',
  ReleaseResources = 'ReleaseResources',
  SetExecutionOptions = 'SetExecutionOptions'
}
