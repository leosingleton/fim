// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

/** String values used in the DispatcherCommand.opcode property */
export enum DispatcherOpcodes {
  Create = 'Create',
  CreateImage = 'CreateImage',
  Dispose = 'Dispose',
  ExecutionBarrier = 'ExecutionBarrier',
  ImageFillSolid = 'ImageFillSolid',
  ImageGetPixel = 'ImageGetPixel',
  ImageLoadPixelData = 'ImageLoadPixelData',
  ImageSetOptions = 'ImageSetOptions',
  ReleaseResources = 'ReleaseResources',
  SetExecutionOptions = 'SetExecutionOptions'
}
