// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimGLCanvas } from './FimGLCanvas';
import { FimGLError, FimGLErrorCode } from './FimGLError';
import { IFimGLTextureLike } from './FimGLTexture';
import { FimGLShader, FimGLVariableDefinition } from './FimGLShader';
import { FimObjectType, recordCreate, recordDispose, recordWebGLRender } from '../debug/FimStats';
import { Transform2D } from '../math/Transform2D';
import { Transform3D } from '../math/Transform3D';
import { TwoTriangles } from '../math/TwoTriangles';
import { FimRect } from '../primitives/FimRect';
import { deepCopy, IDisposable, DisposableSet } from '@leosingleton/commonlibs';
import { GlslShader } from 'webpack-glsl-minify';

const defaultVertexShader: GlslShader = require('./glsl/vertex.glsl');

/** Uniform definition. A combination of values from the GLSL shader compiler and from execution time. */
export interface UniformDefinition extends FimGLVariableDefinition {
  /** Location value bound to the uniform. Set when the uniform is bound in compile(). */
  uniformLocation?: WebGLUniformLocation,

  /** When the uniform type is sampler, holds the texture unit assigned to the texture */
  textureUnit?: number
}

/** Map of uniform values */
export interface UniformDefinitionMap { [name: string]: UniformDefinition }

/**
 * Abstract base class for implementing WebGL programs.
 *
 * Derived classes should implement two functions:
 *
 * 1. A constructor which loads the fragment shader from an embedded GLSL file. The constructor may also accept any
 *    const values as parameters and initialize them. Finally, it should call compileProgram() to compile the shaders.
 *
 * 2. A setInputs() method which initializes any uniform values. The caller should invoke this before calling
 *    execute().
 */
export abstract class FimGLProgram implements IDisposable {
  public constructor(canvas: FimGLCanvas, fragmentShader: GlslShader, vertexShader = defaultVertexShader) {
    this.glCanvas = canvas;
    this.gl = canvas.gl;

    // Report telemetry for debugging
    recordCreate(this, FimObjectType.GLProgram);

    // Derived classes are likely to hold disposable objects, such as other programs or textures. To make it easy to
    // clean up, they may use this DisposableSet to have resources automatically freed in dispose().
    this.disposable = new DisposableSet();

    // Perform a deep copy in case the same GLSL file is used by multiple programs with different const or uniform
    // values. Callers need to be careful to modify the new versions, not the original, when initializing values.
    this.fragmentShader = deepCopy(fragmentShader) as FimGLShader;
    this.vertexShader = deepCopy(vertexShader) as FimGLShader;
  }

  /** Uniforms used by the program */
  private uniforms: UniformDefinitionMap = {};

  /** Counter used to assign a unique texture unit to each texture */
  private textureCount = 0;

  /**
   * Derived classes should call this function in their constructor after initializing any constants.
   * @param stripVersion Strips any "#version" directives. For WebGL 1, only version 100 is allowed, and it
   *    causes problems with some GLSL compilers.
   */
  protected compileProgram(stripVersion = true): void {
    const gl = this.gl;
    const disposable = this.disposable;

    // Improve debugability by checking whether the WebGL context is lost rather than failing on shader creation
    if (gl.isContextLost()) {
      throw new FimGLError(FimGLErrorCode.ContextLost);
    }

    // Compile the shaders
    const vertexShader = this.compileShader(gl.VERTEX_SHADER, this.vertexShader, stripVersion);
    const fragmentShader = this.compileShader(gl.FRAGMENT_SHADER, this.fragmentShader, stripVersion);

    // Create the program
    const program = disposable.addNonDisposable(gl.createProgram(), p => gl.deleteProgram(p));
    FimGLError.throwOnError(gl);
    gl.attachShader(program, vertexShader);
    FimGLError.throwOnError(gl);
    gl.attachShader(program, fragmentShader);
    FimGLError.throwOnError(gl);
    gl.linkProgram(program);
    FimGLError.throwOnError(gl);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const err = gl.getProgramInfoLog(program);
      console.log(this.vertexShader.sourceCode);
      console.log(this.fragmentShader.sourceCode);
      gl.deleteProgram(program);
      throw new FimGLError(FimGLErrorCode.LinkError, err);
    }

    // Create two triangles that map to the full canvas
    const positionBuffer = this.positionBuffer = disposable.addDisposable(new FimGLArrayBuffer(gl, program, 'aPos', 4));
    const texCoordBuffer = this.texCoordBuffer = disposable.addDisposable(new FimGLArrayBuffer(gl, program, 'aTex', 2));
    positionBuffer.setValues(TwoTriangles.vertexPositions, true);
    texCoordBuffer.setValues(TwoTriangles.textureCoords, true);

    // Get the ID of any uniform variables. Be sure to use the minified name.
    for (const name in this.uniforms) {
      const desc = this.uniforms[name];
      let loc = gl.getUniformLocation(program, desc.variableName);

      // Workaround for headless-gl bug... The WebGL docs say that for uniforms declared as arrays, the [0] suffix is
      // optional. However, headless-gl requires it. We don't track which uniforms are arrays or not, so just try the
      // suffix if it's not found without it. https://github.com/stackgl/headless-gl/issues/170
      if (!loc) {
        loc = gl.getUniformLocation(program, desc.variableName + '[0]');
      }
      FimGLError.throwOnError(gl);

      desc.uniformLocation = loc;
    }

    this.program = program;
  }

  private compileShader(type: number, source: FimGLShader, stripVersion: boolean): WebGLShader {
    const gl = this.gl;

    // Strip #version directives. These break the NodeJS implementation of WebGL.
    let code = source.sourceCode;
    if (stripVersion) {
      code = code.replace(/#version.+/, '');
    }

    // Substitute const values into the shader source code
    for (const name in source.consts) {
      const c = source.consts[name];
      let value: string;
      if (c.variableType === 'int') {
        // GLSL integers must not contain a decimal
        value = Math.floor(c.variableValue as number).toString();
      } else if (c.variableType === 'float') {
        // GLSL floats must contain a decimal
        value = (c.variableValue as number).toString();
        if (value.indexOf('.') === -1) {
          value += '.';
        }
      } else {
        throw new FimGLError(FimGLErrorCode.CompileError, `Unsupported const type ${c.variableType}`);
      }
      code = code.replace(c.variableName, value);
    }

    // Docs don't seem to cover error handling of WebGL's createShader(). It appears to return null on failure instead
    // of using glError(), but checking both just in case...
    const shader = gl.createShader(type);
    FimGLError.throwOnError(gl);
    if (!shader) {
      throw new FimGLError(FimGLErrorCode.UnknownError, 'CreateShader');
    }

    gl.shaderSource(shader, code);
    FimGLError.throwOnError(gl);
    gl.compileShader(shader);
    FimGLError.throwOnError(gl);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const err = gl.getShaderInfoLog(shader);
      console.log(code);
      gl.deleteShader(shader);
      throw new FimGLError(FimGLErrorCode.CompileError, err);
    }

    // Add the uniforms from the shader to the program's uniform list. Assign texture units for samplers.
    const uniforms = source.uniforms;
    for (const name in uniforms) {
      const desc = uniforms[name] as UniformDefinition;
      if (desc.variableType.indexOf('sampler') !== -1) {
        desc.textureUnit = this.textureCount++;
      }
      this.uniforms[name] = desc;
    }

    return shader;
  }

  public dispose(): void {
    // Report telemetry for debugging
    recordDispose(this, FimObjectType.GLProgram);

    this.disposable.dispose();
  }

  /**
   * Updates the vertices. By default, we draw two triangles filling the entire rendering area.
   * @param vertexPositions Vertex positions as an array of vec4 values
   * @param textureCoords Texture coordinates for each vertex as an array of vec2 values
   */
  public setVertices(vertexPositions = TwoTriangles.vertexPositions, textureCoords = TwoTriangles.textureCoords): void {
    this.positionBuffer.setValues(vertexPositions);
    this.texCoordBuffer.setValues(textureCoords);
  }

  /**
   * Updates the vertices by taking the standard two triangles vertices and applying a matrix transformation.
   * @param vertexMatrix Optional 3x3 or 4x4 matrix used to manipulate vertices. The Transform2D and Transform3D
   *    classes can help to create the vertex transformation matrices.
   */
  public applyVertexMatrix(vertexMatrix: Transform2D | Transform3D | number[]): void {
    // Convert the input to a 4x4 matrix
    const matrix = new Transform3D();
    matrix.matrixMultiply(vertexMatrix);

    // Update the vertices
    const vertices = matrix.transformVertexArray(TwoTriangles.vertexPositions);
    this.setVertices(vertices);
  }

  /**
   * Executes a program. Callers should first set the uniform values, usually implemented as setInputs() in
   * FimGLProgram-derived classes.
   * @param outputTexture Destination texture to render to. If unspecified, the output is rendered to the FimGLCanvas.
   * @param destCoords If set, renders the output to the specified destination coordinates using WebGL's viewport and
   *    scissor operations. By default, the destination is the full texture or canvas. Note that the coordinates use
   *    the top-left as the origin, to be consistent with 2D canvases, despite WebGL typically using bottom-left.
   */
  public execute(outputTexture?: IFimGLTextureLike, destCoords?: FimRect): void {
    const gl = this.gl;

    // Validate source texture
    if (outputTexture) {
      FimGLError.throwOnMismatchedGLCanvas(this.glCanvas, outputTexture.getTexture().glCanvas);
    }

    // On the first call the execute(), compile the program
    if (!this.program) {
      this.compileProgram();
    }

    try {
      const destination = outputTexture ? outputTexture.getTexture() : this.glCanvas;
      const destinationFramebuffer = outputTexture ? outputTexture.getTexture().getFramebuffer() : null;

      // Set the framebuffer
      gl.bindFramebuffer(gl.FRAMEBUFFER, destinationFramebuffer);
      FimGLError.throwOnError(gl);

      // Calculate the destCoords. Handle defaults, and flip the Y as WebGL uses a bottom-left coordinate system. Also
      // downscale.
      if (destCoords) {
        destCoords = FimRect.fromXYWidthHeight(destCoords.xLeft, destination.h - destCoords.yBottom, destCoords.w,
          destCoords.h);
      } else {
        destCoords = destination.imageDimensions;
      }
      destCoords = destCoords.rescale(destination.downscaleRatio);

      // Report telemetry for debugging
      recordWebGLRender(this, this.uniforms, destCoords, destination);

      // Set the viewport
      gl.viewport(destCoords.xLeft, destCoords.yTop, destCoords.w, destCoords.h);
      FimGLError.throwOnError(gl);

      // Set the scissor box
      if (destCoords.equals(destination.realDimensions)) {
        gl.disable(gl.SCISSOR_TEST);
        FimGLError.throwOnError(gl);
      } else {
        gl.enable(gl.SCISSOR_TEST);
        FimGLError.throwOnError(gl);
        gl.scissor(destCoords.xLeft, destCoords.yTop, destCoords.w, destCoords.h);
        FimGLError.throwOnError(gl);
      }

      gl.useProgram(this.program);
      FimGLError.throwOnError(gl);

      // Set the uniform values
      for (const name in this.uniforms) {
        const uniform = this.uniforms[name];

        // Error on uniforms which do not have any value assigned. This is a bug in our code.
        // eslint-disable-next-line eqeqeq
        if (uniform.variableValue == undefined) { // == => null or undefined
          throw new FimGLError(FimGLErrorCode.AppError,
            `${uniform.variableType} ${uniform.variableName}=${uniform.variableValue}`);
        }

        if (uniform.variableType.indexOf('sampler') !== -1) {
          // Special case for textures. Bind the texture to the texture unit.
          const t = (uniform.variableValue as IFimGLTextureLike).getTexture();

          if (!t.hasImage) {
            // Throw our own error if the application tries to bind an empty texture to a texture unit. It's not going
            // to work, and WebGL returns a confusing non square power-of-two error if we allow the code to continue.
            throw new FimGLError(FimGLErrorCode.AppError, 'BindEmptyTexture');
          }

          // Ensure the texture belongs to the same WebGL canvas
          FimGLError.throwOnMismatchedGLCanvas(this.glCanvas, t.glCanvas);

          t.bind(uniform.textureUnit);

          // Set the uniform to the texture unit
          this.gl.uniform1iv(uniform.uniformLocation, [uniform.textureUnit]);
        } else {
          // Convert the value to one of the types accepted by WebGL. For single values, make an array of one element.
          let valueArray: Float32Array | number[];
          if (typeof(uniform.variableValue) === 'number') {
            valueArray = [uniform.variableValue];
          } else if (typeof(uniform.variableValue) === 'boolean') {
            valueArray = [uniform.variableValue ? 1 : 0];
          } else {
            valueArray = uniform.variableValue as Float32Array | number[];
          }

          switch (uniform.variableType) {
            case 'float':     this.gl.uniform1fv(uniform.uniformLocation, valueArray); break;
            case 'vec2':      this.gl.uniform2fv(uniform.uniformLocation, valueArray); break;
            case 'vec3':      this.gl.uniform3fv(uniform.uniformLocation, valueArray); break;
            case 'vec4':      this.gl.uniform4fv(uniform.uniformLocation, valueArray); break;
            case 'bool':
            case 'int':       this.gl.uniform1iv(uniform.uniformLocation, valueArray as number[]); break;
            case 'mat2':      this.gl.uniformMatrix2fv(uniform.uniformLocation, false, valueArray); break;
            case 'mat3':      this.gl.uniformMatrix3fv(uniform.uniformLocation, false, valueArray); break;
            case 'mat4':      this.gl.uniformMatrix4fv(uniform.uniformLocation, false, valueArray); break;
            default:
              throw new FimGLError(FimGLErrorCode.AppError, `${uniform.variableType} unsupported`);
          }
        }
        FimGLError.throwOnError(gl);
      }

      // Validate the vertex arrays
      const vertexCount = this.positionBuffer.arrayLength;
      if (vertexCount !== this.texCoordBuffer.arrayLength) {
        // The vertex array and texture coordinate array must have the same number of vertices
        throw new FimGLError(FimGLErrorCode.AppError, 'LengthMismatch');
      }
      if (vertexCount % 3 !== 0) {
        // The number of vertices must be a multiple of 3 as we render triangles
        throw new FimGLError(FimGLErrorCode.AppError, 'InvalidLength');
      }

      // Bind the vertices
      this.positionBuffer.bindArray();
      this.texCoordBuffer.bindArray();

      // Render
      gl.drawArrays(gl.TRIANGLES, 0, vertexCount);
      FimGLError.throwOnError(gl);

      if (outputTexture) {
        // The texture now has an image. Set the boolean so it may be used as an input texture in the future.
        outputTexture.getTexture().hasImage = true;
      }
    } finally {
      // Unbind the program. This doesn't seem to be strictly necessary, but helps to catch bugs.
      gl.useProgram(null);

      // Unbind the vertices
      this.positionBuffer.unbindArray();
      this.texCoordBuffer.unbindArray();

      // Unbind the textures
      for (const name in this.uniforms) {
        const uniform = this.uniforms[name];
        if (uniform.variableType.indexOf('sampler') !== -1) {
          const t = (uniform.variableValue as IFimGLTextureLike).getTexture();
          t.unbind(uniform.textureUnit);
        }
      }
    }
  }

  protected readonly glCanvas: FimGLCanvas;
  protected readonly gl: WebGLRenderingContext;
  protected readonly fragmentShader: FimGLShader;
  protected readonly vertexShader: FimGLShader;
  protected readonly disposable: DisposableSet;
  private program: WebGLProgram;
  private positionBuffer: FimGLArrayBuffer;
  private texCoordBuffer: FimGLArrayBuffer;
}

/** Helper class to set array buffers in WebGL Programs */
class FimGLArrayBuffer implements IDisposable {
  /**
   * Constructor
   * @param gl WebGL contxet
   * @param program WebGL program
   * @param attributeName Name of the attribute in the program
   * @param size Size of each vector
   * @param drawStatic Hint to WebGL: true = set once, false = set many times
   */
  public constructor(gl: WebGLRenderingContext, program: WebGLProgram, attributeName: string, size: number) {
    this.gl = gl;
    this.size = size;

    this.attributeLocation = gl.getAttribLocation(program, attributeName);
    FimGLError.throwOnError(gl);

    this.buffer = gl.createBuffer();
    FimGLError.throwOnError(gl);
  }

  /** Sets the value of the buffer */
  public setValues(values: number[], drawStatic = false): void {
    const gl = this.gl;

    // Ensure the array
    if (values.length % this.size !== 0) {
      throw new FimGLError(FimGLErrorCode.AppError, 'ArraySize');
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    FimGLError.throwOnError(gl);

    const usage = drawStatic ? gl.STATIC_DRAW : gl.DYNAMIC_DRAW;
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(values), usage);
    FimGLError.throwOnError(gl);

    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    this.arrayLength = values.length / this.size;
  }

  /** Length of the array buffer, in number of vectors */
  public arrayLength: number;

  public bindArray(): void {
    const gl = this.gl;

    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    FimGLError.throwOnError(gl);

    const index = this.attributeLocation;
    gl.enableVertexAttribArray(index);
    FimGLError.throwOnError(gl);

    gl.vertexAttribPointer(index, this.size, gl.FLOAT, false, 0, 0);
    FimGLError.throwOnError(gl);

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }

  public unbindArray(): void {
    this.gl.disableVertexAttribArray(this.attributeLocation);
  }

  public dispose(): void {
    if (this.buffer) {
      this.gl.deleteBuffer(this.buffer);
      this.buffer = undefined;
    }
  }

  private readonly gl: WebGLRenderingContext;
  private readonly size: number;
  private readonly attributeLocation: number;
  private buffer: WebGLBuffer;
}
