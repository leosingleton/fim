// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimGLCanvas, FimGLProgram } from '../../../build/dist/index.js';
import { FimGLVariableDefinitionMap, FimGLShader } from '../../../build/dist/gl/FimGLShader';
import { using } from '@leosingleton/commonlibs';
import $ from 'jquery';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

export namespace Editor {
  export function addShader(): void {
    $('#add-shader').modal('show');
  }

  export async function addShaderOk(): Promise<void> {
    try {
      let name = $('#add-shader-name').val().toString();
      let source = $('#add-shader-source').val().toString();

      let shader = new Shader(name, source);
      shaders.push(shader);
      refreshShaderList();

      $('#add-shader').modal('hide');
    } catch (err) {
      $('#add-shader-errors').text(err);
      $('#add-shader-errors').show();
    }
  }

  export function addTexture(): void {
    console.log('TODO: addTexture');
  }
}

class Program extends FimGLProgram {
  public constructor(canvas: FimGLCanvas, fragmentShader: FimGLShader) {
    super(canvas, fragmentShader);
  }

  public compileProgram(): void {
    super.compileProgram();
  }
}

class Shader implements FimGLShader {
  public constructor(name: string, sourceCode: string) {
    let match: RegExpExecArray

    this.name = name;
    this.sourceCode = sourceCode;

    // Parse the source code looking for uniforms
    let uniformRegex = /uniform\s(\w+)\s(\w+)/g;
    while (match = uniformRegex.exec(sourceCode)) {
      this.uniforms[match[1]] = {
        variableName: match[1],
        variableType: match[0]
      };
    }

    // Parse the source code looking for constants
    let constRegex = /const\s(\w+)\s(\w+)/g;
    while (match = constRegex.exec(sourceCode)) {
      this.consts[match[2]] = {
        variableName: match[2],
        variableType: match[1]
      };
    }

    // Try to compile the shader
    using(new FimGLCanvas(100, 100), gl => {
      using(new Program(gl, this), program => {
        program.compileProgram();
      });
    });
  }

  public readonly name: string;
  public readonly sourceCode: string;
  public readonly uniforms: FimGLVariableDefinitionMap = {};
  public readonly consts: FimGLVariableDefinitionMap = {};
  public executionCount = 0;
}

let shaders: Shader[] = [];

function refreshShaderList(): void {
  $('#shaders tr').remove();
  shaders.forEach(shader => {
    let row = $('<tr/>').appendTo('#shaders');
    row.append($('<td/>').text(shader.name));

    let actions = $('<td/>').appendTo(row);
    actions.append($('<a href="#">Execute</a>').click(() => onExecuteShader(shader)));
    actions.append('&nbsp;|&nbsp;');
    actions.append($('<a href="#">Delete</a>').click(() => onDeleteShader(shader)));
  });
}

function onExecuteShader(shader: Shader): void {
  console.log('TODO: onExecuteShader');
}

function onDeleteShader(shader: Shader): void {
  shaders = shaders.filter(s => s !== shader);
  refreshShaderList();
}
