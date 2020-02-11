// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

/** The core set of properties that FIM uses on CanvasRenderingContext2D or similar interfaces */
export interface RenderingContext2D extends CanvasCompositing, CanvasState, CanvasFillStrokeStyles,
    CanvasImageSmoothing, CanvasRect {
  // Rather than adding every single function, the TypeScript DOM library definition extends the following:
  //   CanvasState, CanvasTransform, CanvasCompositing, CanvasImageSmoothing, CanvasFillStrokeStyles,
  //   CanvasShadowStyles, CanvasFilters, CanvasRect, CanvasDrawPath, CanvasUserInterface, CanvasText, CanvasDrawImage,
  //   CanvasImageData, CanvasPathDrawingStyles, CanvasTextDrawingStyles, CanvasPath
  // Simply include the ones needed unless they cause conflicts in with node-canvas or headless-gl.
}
