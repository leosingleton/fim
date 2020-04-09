// WebGL Sandbox
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { fim } from './Common';
import { FimBrowserImage } from '@leosingleton/fim-browser';

export class Texture {
  public constructor(name: string, image: FimBrowserImage) {
    this.id = ++Texture.idCount;
    this.name = name;
    this.image = image;
  }

  public readonly id: number;
  public readonly name: string;
  public readonly image: FimBrowserImage;
  public isRenaming = false;

  public static async createFromFile(file: File): Promise<Texture> {
    const image = await fim.createImageFromBlobAsync(file);
    return new Texture(file.name, image);
  }

  private static idCount = 0;
}
