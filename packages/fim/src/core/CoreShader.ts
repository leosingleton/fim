// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { CoreArrayBuffer } from './CoreArrayBuffer';
import { CoreCanvasWebGL } from './CoreCanvasWebGL';
import { CoreTexture } from './CoreTexture';
import { CoreValue } from './CoreValue';
import { CoreWebGLObject } from './CoreWebGLObject';
import { FimTwoTriangles } from '../math/FimTwoTriangles';
import { FimTransform2D } from '../math/FimTransform2D';
import { FimTransform3D } from '../math/FimTransform3D';
import { FimError, FimErrorCode } from '../primitives/FimError';
import { FimRect } from '../primitives/FimRect';
import { GlslShader } from 'webpack-glsl-minify';

/** Default vertex shader */
const defaultVertexShader = require('../../build/core/glsl/vertex.glsl.js') as GlslShader;

/** Wrapper around WebGL fragment shaders */
export class CoreShader extends CoreWebGLObject {
  /**
   * Constructor
   * @param parent The parent WebGL canvas
   * @param handle Shader handle, for debugging
   * @param fragmentShader Fragment shader, created using webpack-glsl-minify
   * @param vertexShader Optional vertex shader, created using webpack-glsl-minify
   */
  public constructor(parent: CoreCanvasWebGL, handle: string, fragmentShader: GlslShader,
      vertexShader: GlslShader = defaultVertexShader) {
    super(parent, handle);

    this.fragmentShader = fragmentShader;
    this.vertexShader = vertexShader;
  }

  protected disposeSelf(): void {
    const me = this;
    const gl = me.parentCanvas.getContext(false);

    if (me.program) {
      gl.deleteProgram(me.program);
      me.program = undefined;
    }

    if (me.positionBuffer) {
      me.positionBuffer.dispose();
      me.positionBuffer = undefined;
    }

    if (me.texCoordBuffer) {
      me.texCoordBuffer.dispose();
      me.texCoordBuffer = undefined;
    }
  }

  /**
   * Sets the value of a constant
   * @param name Name of the constant
   * @param value Value of the constant
   */
  public setConstant(name: string, value: number): void {
    const me = this;
    me.ensureNotDisposed();

    // Ensure constants are not changed after the program is compiled
    if (me.program) {
      throw new FimError(FimErrorCode.InvalidState, `${me.handle} is compiled`);
    }

    // Ensure the constant name is valid
    if (!me.fragmentShader.consts[name]) {
      FimError.throwOnInvalidParameter(name);
    }

    me.constValues[name] = value;
  }

  /**
   * Sets the value of multiple constants
   * @param values A dictionary of name-value pairs
   */
  public setConstants(values: { [name: string]: number }): void {
    for (const name in values) {
      this.setConstant(name, values[name]);
    }
  }

  /**
   * Sets the value of a uniform
   * @param name Name of the uniform
   * @param value Value of the uniform
   */
  public setUniform(name: string, value: CoreValue): void {
    const me = this;
    me.ensureNotDisposed();

    // Ensure the uniform name is valid
    if (!me.fragmentShader.uniforms[name]) {
      FimError.throwOnInvalidParameter(name);
    }

    // Update the uniform value. Create the state object on the first call.
    me.initializeUniformState(name);
    me.uniformStates[name].uniformValue = value;
  }

  /**
   * Initializes the state object for a uniform
   * @param name Name of the uniform
   */
  private initializeUniformState(name: string): void {
    if (!this.uniformStates[name]) {
      this.uniformStates[name] = {
        uniformValue: undefined
      };
    }
  }

  /**
   * Sets the value of multiple uniforms
   * @param values A dictionary of name-value pairs
   */
  public setUniforms(values: { [name: string]: CoreValue }): void {
    for (const name in values) {
      this.setUniform(name, values[name]);
    }
  }

  /**
   * Compiles the program. May be called explicitly, otherwise it gets invoked automatically on the first call to
   * execute().
   */
  public compileProgram(): void {
    const me = this;
    me.ensureNotDisposed();
    const canvas = me.parentCanvas;
    const gl = canvas.getContext();

    // Ensure all of the constant values have been set
    for (const name in me.fragmentShader.consts) {
      // Check for null or undefined
      // eslint-disable-next-line eqeqeq
      if (me.constValues[name] == null) {
        throw new FimError(FimErrorCode.InvalidState, `${me.handle} ${name} not set`);
      }
    }

    // Improve debugability by checking whether the WebGL context is lost rather than failing on shader creation
    canvas.throwOnContextLost();

    // Compile the shaders
    const vertexShader = me.compileShader(gl.VERTEX_SHADER, me.vertexShader);
    const fragmentShader = me.compileShader(gl.FRAGMENT_SHADER, me.fragmentShader);

    // Create the program
    const program = gl.createProgram();
    canvas.throwWebGLErrorsDebug();
    gl.attachShader(program, vertexShader);
    canvas.throwWebGLErrorsDebug();
    gl.attachShader(program, fragmentShader);
    canvas.throwWebGLErrorsDebug();
    gl.linkProgram(program);
    canvas.throwWebGLErrorsDebug();

    // Check for link error. Also ensure context is not lost as shown in
    // https://www.khronos.org/webgl/wiki/HandlingContextLost
    if (!gl.getProgramParameter(program, gl.LINK_STATUS) && !gl.isContextLost()) {
      const err = gl.getProgramInfoLog(program);
      if (me.parentCanvas.engineOptions.showTracing || me.parentCanvas.engineOptions.showWarnings) {
        console.log(me.vertexShader.sourceCode);
        console.log(me.fragmentShader.sourceCode);
      }
      gl.deleteProgram(program);
      throw new FimError(FimErrorCode.WebGLLinkError, err);
    }

    // Create two triangles that map to the full canvas
    const positionBuffer = this.positionBuffer = new CoreArrayBuffer(canvas, program, 'aPos', 4);
    const texCoordBuffer = this.texCoordBuffer = new CoreArrayBuffer(canvas, program, 'aTex', 2);
    positionBuffer.setValues(FimTwoTriangles.vertexPositions, true);
    texCoordBuffer.setValues(FimTwoTriangles.textureCoords, true);

    // Get the ID of any uniform variables. Be sure to use the minified name.
    for (const name in me.uniformStates) {
      const desc = me.fragmentShader.uniforms[name];
      const state = me.uniformStates[name];
      let loc = gl.getUniformLocation(program, desc.variableName);
      canvas.throwWebGLErrorsDebug();

      // Workaround for headless-gl bug... The WebGL docs say that for uniforms declared as arrays, the [0] suffix is
      // optional. However, headless-gl requires it. We don't track which uniforms are arrays or not, so just try the
      // suffix if it's not found without it. https://github.com/stackgl/headless-gl/issues/170
      if (!loc) {
        loc = gl.getUniformLocation(program, `${desc.variableName}[0]`);
        canvas.throwWebGLErrorsDebug();
      }

      state.uniformLocation = loc;
    }

    me.program = program;
  }

  private compileShader(type: number, source: GlslShader): WebGLShader {
    const me = this;
    const canvas = me.parentCanvas;
    const gl = canvas.getContext();

    // Substitute const values into the shader source code
    let code = source.sourceCode;
    for (const name in source.consts) {
      const c = source.consts[name];
      const variableValue = me.constValues[name];

      let value: string;
      if (c.variableType === 'int') {
        // GLSL integers must not contain a decimal
        value = Math.floor(variableValue as number).toString();
      } else if (c.variableType === 'float') {
        // GLSL floats must contain a decimal
        value = (variableValue as number).toString();
        if (value.indexOf('.') === -1) {
          value += '.';
        }
      } else {
        throw new FimError(FimErrorCode.WebGLCompileError, `Unsupported const type ${c.variableType}`);
      }

      code = code.replace(c.variableName, value);
    }

    // Docs don't seem to cover error handling of WebGL's createShader(). It appears to return null on failure instead
    // of using glError(), but checking both just in case...
    const shader = gl.createShader(type);
    canvas.throwWebGLErrorsDebug();
    if (!shader) {
      throw new FimError(FimErrorCode.WebGLCompileError, 'createShader');
    }

    gl.shaderSource(shader, code);
    canvas.throwWebGLErrorsDebug();
    gl.compileShader(shader);
    canvas.throwWebGLErrorsDebug();

    // Check for compile error. Also ensure context is not lost as shown in
    // https://www.khronos.org/webgl/wiki/HandlingContextLost
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS) && !gl.isContextLost()) {
      const err = gl.getShaderInfoLog(shader);
      if (me.parentCanvas.engineOptions.showTracing || me.parentCanvas.engineOptions.showWarnings) {
        console.log(code);
      }
      gl.deleteShader(shader);
      throw new FimError(FimErrorCode.WebGLCompileError, err);
    }

    // Add the uniforms from the shader to the program's uniform list. Assign texture units for samplers.
    for (const name in source.uniforms) {
      me.initializeUniformState(name);
      const desc = source.uniforms[name];
      if (desc.variableType.indexOf('sampler') !== -1) {
        me.uniformStates[name].textureUnit = me.textureCount++;
      }
    }

    return shader;
  }

  /**
   * Updates the vertices. By default, we draw two triangles filling the entire rendering area.
   * @param vertexPositions Vertex positions as an array of vec4 values
   * @param textureCoords Texture coordinates for each vertex as an array of vec2 values
   */
  public setVertices(vertexPositions = FimTwoTriangles.vertexPositions, textureCoords = FimTwoTriangles.textureCoords):
      void {
    const me = this;
    me.ensureNotDisposed();

    // On the first call of setVertices(), compile the program
    if (!me.positionBuffer || !me.texCoordBuffer) {
      me.compileProgram();
    }

    me.positionBuffer.setValues(vertexPositions);
    me.texCoordBuffer.setValues(textureCoords);
  }

  /**
   * Updates the vertices by taking the standard two triangles vertices and applying a matrix transformation.
   * @param vertexMatrix 3x3 or 4x4 matrix used to manipulate vertices. The Transform2D and Transform3D
   *    classes can help to create the vertex transformation matrices.
   */
  public applyVertexMatrix(vertexMatrix: FimTransform2D | FimTransform3D | number[]): void {
    // Convert the input to a 4x4 matrix
    const matrix = new FimTransform3D();
    matrix.matrixMultiply(vertexMatrix);

    // Update the vertices
    const vertices = matrix.transformVertexArray(FimTwoTriangles.vertexPositions);
    this.setVertices(vertices);
  }

  /**
   * Executes a program. Callers must first set the constant and uniform values before calling this method.
   * @param outputTexture Destination texture to render to. If unspecified, the output is rendered to the parent
   *    CoreCanvasWebGL.
   * @param destCoords If set, renders the output to the specified destination coordinates using WebGL's viewport and
   *    scissor operations. By default, the destination is the full texture or canvas. Note that the coordinates use
   *    the top-left as the origin, to be consistent with 2D canvases, despite WebGL typically using bottom-left.
   */
  public execute(outputTexture?: CoreTexture, destCoords?: FimRect): void {
    const me = this;
    me.ensureNotDisposed();
    const canvas = me.parentCanvas;
    const gl = canvas.getContext();

    // Validate output texture belongs to the same WebGL canvas
    if (outputTexture) {
      canvas.throwOnNotChild(outputTexture);
    }

    // On the first call of execute(), compile the program
    if (!me.program) {
      me.compileProgram();
    }

    try {
      const outputRect = FimRect.fromDimensions(outputTexture ? outputTexture.textureDimensions :
        canvas.canvasDimensions);
      const destinationFramebuffer = outputTexture ? outputTexture.getFramebuffer() : null;

      // Set the framebuffer
      gl.bindFramebuffer(gl.FRAMEBUFFER, destinationFramebuffer);
      canvas.throwWebGLErrorsDebug();

      // Calculate the destCoords. Handle defaults, and flip the Y as WebGL uses a bottom-left coordinate system.
      if (destCoords) {
        destCoords = FimRect.fromXYWidthHeight(destCoords.xLeft, outputRect.dim.h - destCoords.yBottom,
          destCoords.dim.w, destCoords.dim.h);
      } else {
        destCoords = outputRect;
      }

      // Report telemetry for debugging
      //recordWebGLRender(this, this.uniforms, destCoords, destination);

      // Set the viewport
      gl.viewport(destCoords.xLeft, destCoords.yTop, destCoords.dim.w, destCoords.dim.h);
      canvas.throwWebGLErrorsDebug();

      // Set the scissor box
      if (destCoords.equals(outputRect)) {
        gl.disable(gl.SCISSOR_TEST);
        canvas.throwWebGLErrorsDebug();
      } else {
        gl.enable(gl.SCISSOR_TEST);
        canvas.throwWebGLErrorsDebug();
        gl.scissor(destCoords.xLeft, destCoords.yTop, destCoords.dim.w, destCoords.dim.h);
        canvas.throwWebGLErrorsDebug();
      }

      gl.useProgram(this.program);
      canvas.throwWebGLErrorsDebug();

      // Set the uniform values
      for (const name in this.uniformStates) {
        const uniform = this.fragmentShader.uniforms[name];
        const state = this.uniformStates[name];

        // Error on uniforms which do not have any value assigned. This is a bug in our code.
        const value = state.uniformValue;
        // eslint-disable-next-line eqeqeq
        if (!state || value == undefined) { // == => null or undefined
          throw new FimError(FimErrorCode.InvalidState,
            `${me.handle} ${uniform.variableType} ${name}=${value}`);
        }

        if (uniform.variableType.indexOf('sampler') !== -1) {
          // Special case for textures. Bind the texture to the texture unit.
          const t = value as CoreTexture;

          if (!t.hasImage) {
            // Throw our own error if the application tries to bind an empty texture to a texture unit. It's not going
            // to work, and WebGL returns a confusing non square power-of-two error if we allow the code to continue.
            throw new FimError(FimErrorCode.ImageUninitialized, `${t.handle} => ${me.handle}`);
          }

          // Ensure the texture belongs to the same WebGL canvas
          canvas.throwOnNotChild(t);

          t.bind(state.textureUnit);

          // Set the uniform to the texture unit
          gl.uniform1iv(state.uniformLocation, [state.textureUnit]);
        } else {
          // Convert the value to one of the types accepted by WebGL. For single values, make an array of one element.
          let valueArray: Float32Array | number[];
          if (typeof(value) === 'number') {
            valueArray = [value];
          } else if (typeof(value) === 'boolean') {
            valueArray = [value ? 1 : 0];
          } else {
            valueArray = value as Float32Array | number[];
          }

          const uniformLocation = state.uniformLocation;
          switch (uniform.variableType) {
            case 'float':     gl.uniform1fv(uniformLocation, valueArray); break;
            case 'vec2':      gl.uniform2fv(uniformLocation, valueArray); break;
            case 'vec3':      gl.uniform3fv(uniformLocation, valueArray); break;
            case 'vec4':      gl.uniform4fv(uniformLocation, valueArray); break;
            case 'bool':
            case 'int':       gl.uniform1iv(uniformLocation, valueArray as number[]); break;
            case 'mat2':      gl.uniformMatrix2fv(uniformLocation, false, valueArray); break;
            case 'mat3':      gl.uniformMatrix3fv(uniformLocation, false, valueArray); break;
            case 'mat4':      gl.uniformMatrix4fv(uniformLocation, false, valueArray); break;
            default:
              throw new FimError(FimErrorCode.GenericAppError, `${uniform.variableType} unsupported`);
          }
        }
        canvas.throwWebGLErrorsDebug();
      }

      // Validate the vertex arrays
      const vertexCount = me.positionBuffer.arrayLength;
      if (vertexCount !== me.texCoordBuffer.arrayLength) {
        // The vertex array and texture coordinate array must have the same number of vertices
        throw new FimError(FimErrorCode.GenericAppError, 'LengthMismatch');
      }
      if (vertexCount % 3 !== 0) {
        // The number of vertices must be a multiple of 3 as we render triangles
        throw new FimError(FimErrorCode.GenericAppError, 'InvalidLength');
      }

      // Bind the vertices
      me.positionBuffer.bindArray();
      me.texCoordBuffer.bindArray();

      // Render
      gl.drawArrays(gl.TRIANGLES, 0, vertexCount);
      canvas.throwWebGLErrorsDebug();

      // The output texture or canvas now has an image. Set the boolean so it may be used as an input in the future.
      const outputTextureOrCanvas = outputTexture ?? canvas;
      outputTextureOrCanvas.hasImage = true;
    } finally {
      // Unbind the program. This doesn't seem to be strictly necessary, but helps to catch bugs.
      gl.useProgram(null);

      // Unbind the vertices
      me.positionBuffer.unbindArray();
      me.texCoordBuffer.unbindArray();

      // Unbind the textures
      for (const name in me.uniformStates) {
        const state = me.uniformStates[name];
        if (me.fragmentShader.uniforms[name].variableType.indexOf('sampler') !== -1) {
          const t = state.uniformValue as CoreTexture;
          t.unbind(state.textureUnit);
        }
      }
    }
  }

  /** Fragment shader, created using webpack-glsl-minify */
  private fragmentShader: GlslShader;

  /** Vertex shader, created using webpack-glsl-minify */
  private vertexShader: GlslShader;

  private constValues: { [name: string]: CoreValue } = {};
  private uniformStates: { [name: string]: UniformState } = {};

  /** Counter used to assign a unique texture unit to each texture */
  private textureCount = 0;

  private program: WebGLProgram;
  private positionBuffer: CoreArrayBuffer;
  private texCoordBuffer: CoreArrayBuffer;
}

/** Runtime state for each uniform */
interface UniformState {
  /** Value of the uniform */
  uniformValue: CoreValue,

  /** Location value bound to the uniform. Set when the uniform is bound in compile(). */
  uniformLocation?: WebGLUniformLocation,

  /** When the uniform type is sampler, holds the texture unit assigned to the texture */
  textureUnit?: number
}
