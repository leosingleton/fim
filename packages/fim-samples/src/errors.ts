// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { DocumentReady, UnhandledError } from '@leosingleton/commonlibs';

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
