// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

/** An `HTMLImageElement`-like object, which can be passed to `context.drawImage()` */
export interface ImageSource {
  src: any;
  onload: any;
  onerror: any;
  width: number;
  height: number;
}
