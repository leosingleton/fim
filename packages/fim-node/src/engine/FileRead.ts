// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { readFile } from 'fs';

/**
 * Helper function to read a binary file
 * @param path Path of the file to read
 * @returns File contents, as a `Uint8Array`
 */
export async function fileRead(path: string): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    readFile(path, (err, data) => {
      if (err) {
        reject(err);
      }

      resolve(new Uint8Array(data));
    });
  });
}
