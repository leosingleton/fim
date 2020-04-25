// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { CoreCanvasWebGL } from './CoreCanvasWebGL';
import { FimError } from '../primitives/FimError';

/** Helper class to set array buffers in WebGL Programs */
export class CoreArrayBuffer {
  /**
   * Constructor
   * @param glCanvas WebGL canvas
   * @param program WebGL program
   * @param attributeName Name of the attribute in the program
   * @param size Size of each vector
   */
  public constructor(glCanvas: CoreCanvasWebGL, program: WebGLProgram, attributeName: string, size: number) {
    this.glCanvas = glCanvas;
    this.vectorSize = size;

    const gl = glCanvas.getContext();
    this.attributeLocation = gl.getAttribLocation(program, attributeName);
    glCanvas.throwWebGLErrorsDebug();

    this.glBuffer = gl.createBuffer();
    glCanvas.throwWebGLErrorsDebug();
  }

  public dispose(): void {
    const me = this;
    me.ensureNotDisposed();

    const gl = me.glCanvas.getContext(false);

    // Dispose the ArrayBuffer
    if (me.glBuffer) {
      gl.deleteBuffer(me.glBuffer);
      me.glBuffer = undefined;
    }

    // Ensure this object is no longer used
    me.glCanvas = undefined;
    me.isDisposed = true;
  }

  /** Set by the dispose() method */
  protected isDisposed = false;

  /** Throws an exception if the object is disposed */
  protected ensureNotDisposed(): void {
    if (this.isDisposed) {
      FimError.throwOnObjectDisposed(`ArrayBuffer of ${this.glCanvas.objectHandle}`);
    }
  }

  /**
   * Sets the value of the buffer
   * @param values New values of the ArrayBuffer
   * @param drawStatic Hint to WebGL: true = set once, false = set many times
   */
  public setValues(values: number[], drawStatic = false): void {
    const me = this;
    const glCanvas = me.glCanvas;
    const gl = glCanvas.getContext();

    // Ensure the array is the expected size
    if (values.length % me.vectorSize !== 0) {
      FimError.throwOnInvalidParameter(values.length);
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, me.glBuffer);
    glCanvas.throwWebGLErrorsDebug();

    const usage = drawStatic ? gl.STATIC_DRAW : gl.DYNAMIC_DRAW;
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(values), usage);
    glCanvas.throwWebGLErrorsDebug();

    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    me.arrayLength = values.length / me.vectorSize;
  }

  /** Length of the array buffer, in number of vectors */
  public arrayLength: number;

  public bindArray(): void {
    const me = this;
    const glCanvas = me.glCanvas;
    const gl = glCanvas.getContext();

    gl.bindBuffer(gl.ARRAY_BUFFER, me.glBuffer);
    glCanvas.throwWebGLErrorsDebug();

    const index = me.attributeLocation;
    gl.enableVertexAttribArray(index);
    glCanvas.throwWebGLErrorsDebug();

    gl.vertexAttribPointer(index, me.vectorSize, gl.FLOAT, false, 0, 0);
    glCanvas.throwWebGLErrorsDebug();

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    glCanvas.throwWebGLErrorsDebug();
  }

  public unbindArray(): void {
    const glCanvas = this.glCanvas;
    const gl = glCanvas.getContext();

    gl.disableVertexAttribArray(this.attributeLocation);
    glCanvas.throwWebGLErrorsDebug();
  }

  private glCanvas: CoreCanvasWebGL;
  private readonly vectorSize: number;
  private readonly attributeLocation: number;
  private glBuffer: WebGLBuffer;
}
