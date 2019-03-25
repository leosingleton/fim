// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimGLCanvas } from './FimGLCanvas';
import { FimGLError, FimGLErrorCode } from './FimGLError';
import { FimGLTexture } from './FimGLTexture';
import { FimGLShader, FimGLVariableDefinition } from './FimGLShader';
import { deepCopy, IDisposable } from '@leosingleton/commonlibs';

let defaultVertexShader: FimGLShader = require('./glsl/vertex.glsl');

/** Uniform definition. A combination of values from the GLSL shader compiler and from execution time. */
interface UniformDefinition extends FimGLVariableDefinition {
  /** Location value bound to the uniform. Set when the uniform is bound in compile(). */
  uniformLocation?: WebGLUniformLocation,

  /** When the uniform type is sampler, holds the texture unit assigned to the texture */
  textureUnit?: number
}

/** Map of uniform values */
type UniformDefinitionMap = { [name: string]: UniformDefinition };

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
  constructor(canvas: FimGLCanvas, fragmentShader: FimGLShader, vertexShader = defaultVertexShader) {
    this.glCanvas = canvas;
    this.gl = canvas.gl;

    // Perform a deep copy in case the same GLSL file is used by multiple programs with different const or uniform
    // values. Callers need to be careful to modify the new versions, not the original, when initializing values.
    this.fragmentShader = deepCopy(fragmentShader);
    this.vertexShader = deepCopy(vertexShader);
  }

  /** Uniforms used by the program */
  private uniforms: UniformDefinitionMap = {};

  /** Counter used to assign a unique texture unit to each texture */
  private textureCount = 0;

  /** Derived classes should call this function in their constructor after initializing any constants. */
  protected compileProgram(): void {
    let gl = this.gl;
    
    // Compile the shaders
    let vertexShader = this.compileShader(gl.VERTEX_SHADER, this.vertexShader);
    let fragmentShader = this.compileShader(gl.FRAGMENT_SHADER, this.fragmentShader);

    // Create the program
    let program = gl.createProgram();
    FimGLError.throwOnError(gl);
    gl.attachShader(program, vertexShader);
    FimGLError.throwOnError(gl);
    gl.attachShader(program, fragmentShader);
    FimGLError.throwOnError(gl);
    gl.linkProgram(program);
    FimGLError.throwOnError(gl);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      let err = gl.getProgramInfoLog(program);
      console.log(this.vertexShader.sourceCode);
      console.log(this.fragmentShader.sourceCode);
      gl.deleteProgram(program);
      throw new FimGLError(FimGLErrorCode.LinkError, err);
    }

    // Create two triangles that map to the full canvas
    this.positionBuffer = gl.createBuffer();
    FimGLError.throwOnError(gl);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    FimGLError.throwOnError(gl);
    let triangles = new Float32Array([
      0, 0,
      1, 0,
      1, 1,
      0, 0,
      0, 1,
      1, 1,
    ]);
    gl.bufferData(gl.ARRAY_BUFFER, triangles, gl.STATIC_DRAW);
    FimGLError.throwOnError(gl);

    // Get the ID of the position attribute
    this.positionAttributeLocation = gl.getAttribLocation(program, 'aPos');
    FimGLError.throwOnError(gl);

    // Get the ID of any uniform variables. Be sure to use the minified name.
    for (let name in this.uniforms) {
      let desc = this.uniforms[name];
      desc.uniformLocation = gl.getUniformLocation(program, desc.variableName);
      FimGLError.throwOnError(gl);
    }
  
    this.program = program;
  }

  private compileShader(type: number, source: FimGLShader): WebGLShader {
    let gl = this.gl;

    // Substitute const values into the shader source code
    let code = source.sourceCode;
    for (let name in source.consts) {
      let c = source.consts[name];
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
        throw new FimGLError(FimGLErrorCode.CompileError, 'Unsupported const type ' + c.variableType);
      }
      code = code.replace(c.variableName, value);
    }

    let shader = gl.createShader(type);
    FimGLError.throwOnError(gl);
    gl.shaderSource(shader, code);
    FimGLError.throwOnError(gl);
    gl.compileShader(shader);
    FimGLError.throwOnError(gl);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      let err = gl.getShaderInfoLog(shader);
      console.log(code);
      gl.deleteShader(shader);
      throw new FimGLError(FimGLErrorCode.CompileError, err);
    }

    // Add the uniforms from the shader to the program's uniform list. Assign texture units for samplers.
    let uniforms = source.uniforms;
    for (let name in uniforms) {
      let desc = uniforms[name] as UniformDefinition;
      if (desc.variableType.indexOf('sampler') !== -1) {
        desc.textureUnit = this.textureCount++;
      }
      this.uniforms[name] = desc;
    }

    return shader;
  }

  public dispose(): void {
    let gl = this.gl;

    if (this.positionBuffer) {
      gl.deleteBuffer(this.positionBuffer);
      this.positionBuffer = undefined;
    }

    if (this.program) {
      gl.deleteProgram(this.program);
      this.program = undefined;
    }

    this.gl = undefined;
  }

  /**
   * Executes a program. Callers should first set the uniform values, usually implemented as setInputs() in
   * FimGLProgram-derived classes.
   * @param outputTexture Destination texture to render to. If unspecified, the output is rendered to the FimGLCanvas.
   */
  public execute(outputTexture?: FimGLTexture): void {
    let gl = this.gl;

    // On the first call the execute(), compile the program
    if (!this.program) {
      this.compileProgram();
    }

    let flip: number;
    if (outputTexture) {
      // Use a framebuffer to render to a texture
      gl.bindFramebuffer(gl.FRAMEBUFFER, outputTexture.getFramebuffer());
      FimGLError.throwOnError(gl);
      gl.viewport(0, 0, outputTexture.w, outputTexture.h);
      FimGLError.throwOnError(gl);
      flip = 1; // Don't flip the image
    } else {
      // Render to the canvas
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      FimGLError.throwOnError(gl);
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      FimGLError.throwOnError(gl);
      flip = -1; // Flip the final image
    }

    let flipUniform = this.vertexShader.uniforms.uFlip;
    if (flipUniform) {
      flipUniform.variableValue = flip;
    }

    gl.useProgram(this.program);
    FimGLError.throwOnError(gl);

    // Set the uniform values
    for (let name in this.uniforms) {
      let uniform = this.uniforms[name];

      // Error on uniforms which do not have any value assigned. This is a bug in our code.
      if (uniform.variableValue == undefined) { // == => null or undefined
        throw new Error(uniform.variableType + ' ' + uniform.variableName + '=' + uniform.variableValue);
      }

      if (uniform.variableType.indexOf('sampler') !== -1) {
        // Special case for textures. Bind the texture to the texture unit.
        let t = uniform.variableValue as FimGLTexture;
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
          default:
            throw new Error('Unsupported type ' + uniform.variableType);
        }
      }
      FimGLError.throwOnError(gl);
    }

    // Bind the vertices
    gl.enableVertexAttribArray(this.positionAttributeLocation);
    FimGLError.throwOnError(gl);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    FimGLError.throwOnError(gl);
    gl.vertexAttribPointer(this.positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);
    FimGLError.throwOnError(gl);

    // Render
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    FimGLError.throwOnError(gl);
  }

  protected glCanvas: FimGLCanvas;
  protected gl: WebGLRenderingContext;
  protected fragmentShader: FimGLShader;
  protected vertexShader: FimGLShader;
  private program: WebGLProgram;
  private positionBuffer: WebGLBuffer;
  private positionAttributeLocation: number;
}
