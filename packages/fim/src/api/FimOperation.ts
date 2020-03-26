// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { Fim } from './Fim';
import { FimImage } from './FimImage';
import { FimObject } from './FimObject';
import { FimObjectBase } from './FimObjectBase';
import { FimReleaseResourcesFlags } from './FimReleaseResourcesFlags';
import { FimRect } from '../primitives/FimRect';

/**
 * Base class for FIM operation classes. In FIM, operations wrap one or more shaders into a more high-level operation,
 * managing the setting of constants, uniforms, and vertices, and also invoking shaders in the correct order while
 * managing any temporary images.
 */
export abstract class FimOperation extends FimObjectBase {
  /**
   * Constructor
   * @param parent Parent object
   * @param objectName Optional object name to help for debugging
   */
  protected constructor(parent: FimObject, objectName?: string) {
    super('Op', objectName, parent);
  }

  // Specify a more specific type for rootObject
  public rootObject: Fim;

  protected releaseOwnResources(_flags: FimReleaseResourcesFlags): void {
    // Do nothing. Most FIM operations consist solely of other FIM primitives registed via addChild(), so don't have
    // any explicit resources to clean up.
  }

  /**
   * Derived classes must implement this method to execute the operation.
   * @param outputImage Destination image to render to
   * @param destCoords If set, renders the output to the specified destination coordinates using WebGL's viewport and
   *    scissor operations. By default, the destination is the full texture or canvas. Note that the coordinates use
   *    the top-left as the origin, to be consistent with 2D canvases, despite WebGL typically using bottom-left.
   */
  public abstract executeAsync(outputImage: FimImage, destCoords?: FimRect): Promise<void>;
}
