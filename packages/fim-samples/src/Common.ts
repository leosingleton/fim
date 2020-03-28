// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { DocumentReady, UnhandledError, parseQueryString } from '@leosingleton/commonlibs';
import { FimImage, Fim } from '@leosingleton/fim';

const qs = parseQueryString();

/** Loads a test image and returns the JPEG as a byte array */
export async function loadTestImageToArray(): Promise<Uint8Array> {
  // Load a sample JPEG image into a byte array
  const url = qs.img || 'https://upload.wikimedia.org/wikipedia/commons/9/97/The_Earth_seen_from_Apollo_17.jpg';
  const fetchResponse = await fetch(url, { method: 'GET' });
  const jpeg = await fetchResponse.arrayBuffer();
  return new Uint8Array(jpeg);
}

/** Loads a test image onto a FimCanvas */
export async function loadTestImage(fim: Fim): Promise<FimImage> {
  const jpeg = await loadTestImageToArray();
  return fim.createImageFromJpegAsync(jpeg);
}

/** Blocks execution until the browser is ready to render another frame */
export async function waitForAnimationFrame(): Promise<void> {
  return new Promise(resolve => {
    requestAnimationFrame(() => {
      resolve();
    });
  });
}

// Unhandled Exception Handling
UnhandledError.registerHandler(async (ue: UnhandledError) => {
  // Block until we can show the error
  await DocumentReady.waitUntilReady();

  // Append the error to <div id="errors">
  const div = $('#errors');
  if (div) {
    div.text(div.text() + '\n\n' + ue.toString());
    div.show(); // Unhide if display: none
  }
});
