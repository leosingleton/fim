// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimError, FimErrorCode } from '@leosingleton/fim';

/**
 * Helper function to download a binary file
 * @param url URL of the file to download
 * @returns File contents, as a `Uint8Array`
 */
export async function fileDownload(url: string): Promise<Uint8Array> {
  const fetchResponse = await fetch(url);
  if (!fetchResponse.ok) {
    throw new FimError(FimErrorCode.FetchError, `${url}: ${fetchResponse.statusText}`);
  }

  const data = await fetchResponse.arrayBuffer();
  return new Uint8Array(data);
}
