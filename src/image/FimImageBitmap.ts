// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { IDisposable } from '@leosingleton/commonlibs';

export class FimImageBitmap implements IDisposable {
  /**
   * Creates a new FimImageBitmap
   * @param image Source image
   */
  public static async create(image: ImageBitmapSource): Promise<FimImageBitmap> {
    let bitmap = await createImageBitmap(image);
    return new FimImageBitmap(bitmap);
  }

  private constructor(bitmap: ImageBitmap) {
    this.bitmap = bitmap;
  }

  /** The ImageBitmap */
  public bitmap: ImageBitmap;

  public dispose(): void {
    if (this.bitmap) {
      this.bitmap.close();
      delete this.bitmap;
    }
  }
}
