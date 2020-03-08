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
    this.size = size;

    const gl = glCanvas.getContext();
    this.attributeLocation = gl.getAttribLocation(program, attributeName);
    glCanvas.throwWebGLErrorsDebug();

    this.buffer = gl.createBuffer();
    glCanvas.throwWebGLErrorsDebug();
  }

  public dispose(): void {
    const me = this;
    me.ensureNotDisposed();

    const gl = me.glCanvas.getContext(false);

    // Dispose the ArrayBuffer
    if (me.buffer) {
      gl.deleteBuffer(me.buffer);
      me.buffer = undefined;
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
      FimError.throwOnObjectDisposed(`ArrayBuffer of ${this.glCanvas.imageHandle}`);
    }
  }

  /**
   * Sets the value of the buffer
   * @param values New values of the ArrayBuffer
   * @param drawStatic Hint to WebGL: true = set once, false = set many times
   */
  public setValues(values: number[], drawStatic = false): void {
    const glCanvas = this.glCanvas;
    const gl = glCanvas.getContext();

    // Ensure the array is the expected size
    if (values.length % this.size !== 0) {
      FimError.throwOnInvalidParameter(values.length);
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    glCanvas.throwWebGLErrorsDebug();

    const usage = drawStatic ? gl.STATIC_DRAW : gl.DYNAMIC_DRAW;
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(values), usage);
    glCanvas.throwWebGLErrorsDebug();

    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    this.arrayLength = values.length / this.size;
  }

  /** Length of the array buffer, in number of vectors */
  public arrayLength: number;

  public bindArray(): void {
    const glCanvas = this.glCanvas;
    const gl = glCanvas.getContext();

    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    glCanvas.throwWebGLErrorsDebug();

    const index = this.attributeLocation;
    gl.enableVertexAttribArray(index);
    glCanvas.throwWebGLErrorsDebug();

    gl.vertexAttribPointer(index, this.size, gl.FLOAT, false, 0, 0);
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
  private readonly size: number;
  private readonly attributeLocation: number;
  private buffer: WebGLBuffer;
}
