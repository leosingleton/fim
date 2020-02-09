// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

/** Helper functions for working with handle strings */
export class HandleBuilder {
  /**
   * Creates an object handle
   * @param objectType A short string indicating the object type, e.g. 'img' for FimImage
   * @param objectName Optional name specified when creating the object to help with debugging
   * @returns Globally-unique handle
   */
  public static createObjectHandle(objectType: string, objectName?: string): string {
    // Create a globally-unique handle name. Although really, only the global handle count is needed, we add the object
    // type and name to make it easier to debug.
    let handle = `${objectType}.${HandleBuilder.globalHandleCount++}`;
    if (objectName) {
      handle += `.${objectName}`;
    }

    // Replace slashes with underscores as slashes are used in the long handle format
    return handle.replace('/', '_');
  }

  /**
   * Creates a long handle containing the full path to an object, starting at the handle of the root object
   * @param objectHandles Object handles, from root (first) to leaf (last). The parameters may include undefined values,
   *    which will be silently ignored.
   * @returns Globally-unique long handle which includes the path to child objects
   */
  public static createLongObjectHandle(...objectHandles: string[]): string {
    let longHandle = '';
    for (const handle of objectHandles) {
      // Ignore undefined elements in the array
      if (!handle) {
        continue;
      }

      // Separate objects with slashes
      if (longHandle) {
        longHandle += '/';
      }

      longHandle += handle;
    }

    return longHandle;
  }

  /**
   * Parses a long handle and separates the root handle
   * @param longHandle A long handle created by createLongObjectHandle()
   * @returns `rootHandle` - The object handle of the root node
   * @returns `longHandle` - Remaining portion of the long handle. May be undefined if there is a single object.
   */
  public static parseLongObjectHandle(longHandle: string): { rootHandle: string, longHandle?: string } {
    const index = longHandle.indexOf('/');
    if (index === -1) {
      return {
        rootHandle: longHandle
      };
    } else {
      return {
        rootHandle: longHandle.substring(0, index),
        longHandle: longHandle.substring(index + 1)
      };
    }
  }

  /** Global counter used to assign a unique handle to objects in FIM */
  private static globalHandleCount = 0;
}