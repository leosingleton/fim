// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { FimCanvas, FimGLCanvas, FimGLProgram, ImageGrid } from '../../../build/dist/index.js';
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

  export async function uploadTextures(files: FileList): Promise<void> {
    for (let i = 0; i < files.length; i++) {
      textures.push(await Texture.createFromFile(files[i]));
    }
    refreshTextureList();
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

class Texture {
  public constructor(name: string, canvas: FimCanvas) {
    this.name = name;
    this.canvas = canvas;
  }

  public readonly name: string;
  public readonly canvas: FimCanvas;

  public static async createFromFile(file: File): Promise<Texture> {
    let canvas = await FimCanvas.createFromImageBlob(file);
    let name = `${file.name} (${canvas.w}x${canvas.h})`;
    return new Texture(name, canvas);
  }
}

let textures: Texture[] = [];

function refreshTextureList(): void {
  $('#textures tr').remove();
  textures.forEach(texture => {
    let row = $('<tr/>').appendTo('#textures');
    row.append($('<td/>').text(texture.name));

    let actions = $('<td/>').appendTo(row);
    actions.append($('<a href="#">View</a>').click(() => onViewTexture(texture)));
    actions.append('&nbsp;|&nbsp;');
    actions.append($('<a href="#">Delete</a>').click(() => onDeleteTexture(texture)));
  });
}

async function onViewTexture(texture: Texture): Promise<void> {
  let canvas = texture.canvas.getCanvas() as HTMLCanvasElement | OffscreenCanvas;
  let blob: Blob;
  if (texture.canvas.offscreenCanvas) {
    let c = canvas as OffscreenCanvas;
    blob = await c.convertToBlob();
  } else {
    let c = canvas as HTMLCanvasElement;
    blob = await new Promise<Blob>(resolve => c.toBlob(blob => resolve(blob)));
  }

  let fr = new FileReader();
  fr.readAsDataURL(blob);
  fr.onload = () => {
    let img = new Image();
    img.src = fr.result as string;

    let popup = window.open('');
    popup.document.write(img.outerHTML);
  };
}

function onDeleteTexture(texture: Texture): void {
  textures = textures.filter(t => t !== texture);
  refreshTextureList();
}
