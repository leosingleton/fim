// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { SelectChannelProgram } from './SelectChannel';
import { FimCanvas, FimGLCanvas, FimGLProgram, FimGLTexture } from '../../../build/dist/index.js';
import { FimGLVariableDefinitionMap, FimGLShader } from '../../../build/dist/gl/FimGLShader';
import { using, DisposableSet } from '@leosingleton/commonlibs';
import { saveAs } from 'file-saver';
import $ from 'jquery';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

export namespace Editor {
  export function onLoad(): void {
    // Load previous shaders from local storage on startup
    for (let n = 0; n < localStorage.length; n++) {
      let key = localStorage.key(n);
      if (key.indexOf('shader_name_') === 0) {
        // We found a shader
        let id = Number.parseInt(key.substring(12));
        let name = localStorage.getItem(`shader_name_${id}`);
        let source = localStorage.getItem(`shader_source_${id}`);

        // Create the shader
        let shader = new Shader(name, source, id);
        shaders.push(shader);  
      }
    }

    refreshShaderList();
  }

  export function addShader(): void {
    onEditShader();
  }

  export async function addShaderOk(): Promise<void> {
    try {
      let name = $('#add-shader-name').val().toString();
      if (!name) {
        throw new Error('Name is required');
      }

      let source = $('#add-shader-source').val().toString();
      if (!source) {
        throw new Error('Source code is required');
      }

      let id = currentShader ? currentShader.id : null;
      let shader = new Shader(name, source, id);
      shaders = shaders.filter(s => s !== currentShader);
      shaders.push(shader);
      refreshShaderList();

      $('#add-shader').modal('hide');
    } catch (err) {
      $('#add-shader-errors').text(err);
      $('#add-shader-errors').show();
    }
  }

  export function executeShaderOk(): void {
    try {
      let canvas = runCurrentShader();

      let texture = new Texture(`Output of ${currentShader.name} ${++currentShader.executionCount}`, canvas);
      textures.push(texture);
      refreshTextureList();

      $('#execute-shader').modal('hide');
    } catch (err) {
      $('#execute-shader-errors').text(err);
      $('#execute-shader-errors').show();
    }
  }

  export async function uploadShaders(files: FileList): Promise<void> {
    for (let i = 0; i < files.length; i++) {
      shaders.push(await Shader.createFromFile(files[i]));
    }
    refreshShaderList();
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

  public setUniform(name: string, value: number | number[] | boolean | FimGLTexture): void {
    this.fragmentShader.uniforms[name].variableValue = value;
  }
}

class Shader implements FimGLShader {
  public constructor(name: string, sourceCode: string, id?: number) {
    let match: RegExpExecArray

    if (!id) {
      id = ++Shader.idCount;
    }

    // When loading from localStorage, also increment the next ID
    if (id > Shader.idCount) {
      Shader.idCount = id;
    }

    this.id = id;
    this.name = name;
    this.sourceCode = sourceCode;

    // Parse the source code looking for uniforms
    let uniformRegex = /uniform\s(\w+)\s(\w+)/g;
    while (match = uniformRegex.exec(sourceCode)) {
      this.uniforms[match[2]] = {
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

    // Write the shader to local storage
    localStorage.setItem(`shader_name_${id}`, name);
    localStorage.setItem(`shader_source_${id}`, sourceCode);
  }

  public readonly id: number;
  public readonly name: string;
  public readonly sourceCode: string;
  public readonly uniforms: FimGLVariableDefinitionMap = {};
  public readonly consts: FimGLVariableDefinitionMap = {};
  public executionCount = 0;

  public static createFromFile(file: File): Promise<Shader> {
    return new Promise((resolve, reject) => {
      let fr = new FileReader();
      fr.readAsText(file);

      // On success, create a Shader and return it via the Promise
      fr.onload = () => {
        let source = fr.result as string;
        let shader = new Shader(file.name, source);
        resolve(shader);
      };

      // On error, return an exception via the Promise
      fr.onerror = err => {
        reject(err);
      };
    });
  }

  private static idCount = 0;
}

let shaders: Shader[] = [];

function refreshShaderList(): void {
  // Sort alphabetically by name
  shaders = shaders.sort(sortByName);

  $('#shaders tr').remove();
  shaders.forEach(shader => {
    let row = $('<tr/>').appendTo('#shaders');
    row.append($('<td/>').text(shader.name));

    let actions = $('<td/>').appendTo(row);
    actions.append($('<a href="#">Execute</a>').click(() => onExecuteShader(shader)));
    actions.append('&nbsp;|&nbsp;');
    actions.append($('<a href="#">Edit</a>').click(() => onEditShader(shader)));
    actions.append('&nbsp;|&nbsp;');
    actions.append($('<a href="#">Delete</a>').click(() => onDeleteShader(shader)));
  });
}

let currentShader: Shader = null;

function onExecuteShader(shader: Shader): void {
  currentShader = shader;

  $('#execute-shader-form div').remove();

  for (let uname in shader.uniforms) {
    let u = shader.uniforms[uname];
    let id = `uniform-${u.variableName}`;
    let text = `${u.variableName} (${u.variableType})`;

    let group = $('<div class="form-group"/>').attr('for', id).appendTo('#execute-shader-form');
    group.append($('<label class="control-label"/>').text(text));
    if (u.variableType.indexOf('sampler') === -1) {
      group.append($('<input type="text" class="form-control"/>').attr('id', id));
    } else {
      let select = $('<select class="form-control"/>').attr('id', id).appendTo(group);
      textures.forEach(texture => {
        select.append($('<option/>').attr('value', texture.id).text(texture.name));
      });
    }
  }

  $('#execute-shader-errors').hide();
  $('#execute-shader').modal('show');
}

function runCurrentShader(): FimCanvas {
  let result: FimCanvas;

  let width = $('#execute-shader-width').val() as number;
  let height = $('#execute-shader-height').val() as number;

  DisposableSet.using(disposable => {
    let gl = disposable.addDisposable(new FimGLCanvas(width, height));
    let program = disposable.addDisposable(new Program(gl, currentShader));

    for (let uname in currentShader.uniforms) {
      let u = currentShader.uniforms[uname];
      let id = `#uniform-${u.variableName}`;
      let value = eval($(id).val().toString());
      if (u.variableType.indexOf('sampler') === -1) {
        program.setUniform(uname, value);
      } else {
        let canvas = textures.find(v => v.id === value).canvas;
        let inputTexture = disposable.addDisposable(new FimGLTexture(gl, canvas.w, canvas.h));
        inputTexture.copyFrom(canvas);
        program.setUniform(uname, inputTexture);
      }
    }
    
    program.execute();
    result = gl.duplicateCanvas();
  });

  return result;
}

/**
 * Displays the dialog box to create or edit a shader
 * @param shader The existing shader if editing. A create dialog is displayed if undefined.
 */
function onEditShader(shader?: Shader): void {
  currentShader = shader;
  $('#add-shader-title').text(shader ? 'Edit Shader' : 'Create New Shader');
  $('#add-shader-ok').text(shader ? 'Edit' : 'Create');
  $('#add-shader-name').val(shader ? shader.name : '');
  $('#add-shader-source').val(shader ? shader.sourceCode : '');
  $('#add-shader-errors').hide();
  $('#add-shader').modal('show');
}

function onDeleteShader(shader: Shader): void {
  shaders = shaders.filter(s => s !== shader);
  refreshShaderList();

  // Also delete from local storage
  localStorage.removeItem(`shader_name_${shader.id}`);
  localStorage.removeItem(`shader_source_${shader.id}`);
}

class Texture {
  public constructor(name: string, canvas: FimCanvas) {
    this.id = ++Texture.idCount;
    this.name = name;
    this.canvas = canvas;
  }

  public readonly id: number;
  public readonly name: string;
  public readonly canvas: FimCanvas;
  public isRenaming = false;

  public static async createFromFile(file: File): Promise<Texture> {
    let canvas = await FimCanvas.createFromImageBlob(file);
    let name = `${file.name} (${canvas.w}x${canvas.h})`;
    return new Texture(name, canvas);
  }

  private static idCount = 0;
}

let textures: Texture[] = [];

function refreshTextureList(): void {
  // Sort alphabetically by name
  textures = textures.sort(sortByName);

  $('#textures tr').remove();
  textures.forEach(texture => {
    let row = $('<tr/>').appendTo('#textures');
    if (!texture.isRenaming) {
      row.append($('<td/>').text(texture.name));
    } else {
      // When renaming, the name becomes an edit box
      row.append($('<td/>').append($('<input type="text" id="rename-texture" class="form-control"/>')
        .val(texture.name).focusout(() => onRenameTextureDone(texture))));
    }

    let actions = $('<td/>').appendTo(row);
    actions.append($('<a href="#">View</a>').click(() => onViewTexture(texture)));
    actions.append('&nbsp;(');
    actions.append($('<a href="#">R</a>').click(() => onViewTextureChannel(texture, 'R')));
    actions.append('&nbsp;');
    actions.append($('<a href="#">G</a>').click(() => onViewTextureChannel(texture, 'G')));
    actions.append('&nbsp;');
    actions.append($('<a href="#">B</a>').click(() => onViewTextureChannel(texture, 'B')));
    actions.append('&nbsp;');
    actions.append($('<a href="#">A</a>').click(() => onViewTextureChannel(texture, 'A')));
    actions.append(')&nbsp;|&nbsp;');
    actions.append($('<a href="#">Download</a>').click(() => onDownloadTexture(texture)));
    actions.append('&nbsp;|&nbsp;');
    actions.append($('<a href="#">Rename</a>').click(() => onRenameTexture(texture)));
    actions.append('&nbsp;|&nbsp;');
    actions.append($('<a href="#">Delete</a>').click(() => onDeleteTexture(texture)));
  });
}

/** Called when the button to rename a texture is clicked. Changes the name to an edit box. */
function onRenameTexture(texture: Texture): void {
  texture.isRenaming = true;
  refreshTextureList();
}

/** Called when the edit box to rename a texture loses focus. Performs the actual rename. */
function onRenameTextureDone(texture: Texture): void {
  let name = $('#rename-texture').val().toString();
  let newTexture = new Texture(name, texture.canvas);
  textures = textures.filter(t => t !== texture);
  textures.push(newTexture);
  refreshTextureList();
}

function onViewTexture(texture: Texture): Promise<void> {
  return onViewCanvas(texture.canvas);
}

async function onViewCanvas(canvas: FimCanvas): Promise<void> {
  let blob = await canvas.toPngBlob();

  let fr = new FileReader();
  fr.readAsDataURL(blob);
  fr.onload = () => {
    let img = new Image();
    img.src = fr.result as string;

    let popup = window.open('');
    popup.document.write(img.outerHTML);
  };
}

function onViewTextureChannel(texture: Texture, channel: 'R' | 'G' | 'B' | 'A'): Promise<void> {
  let result: Promise<void>;
  DisposableSet.using(disposable => {
    let oldCanvas = texture.canvas;
    let gl = disposable.addDisposable(new FimGLCanvas(oldCanvas.w, oldCanvas.h));
    let tex = disposable.addDisposable(FimGLTexture.createFrom(gl, oldCanvas));
    let p = disposable.addDisposable(new SelectChannelProgram(gl));
    p.setInputs(tex, channel);
    p.execute();

    let newCanvas = disposable.addDisposable(gl.duplicateCanvas());
    result = onViewCanvas(newCanvas);
  });

  return result;
}

/** Handler for the Download button */
async function onDownloadTexture(texture: Texture): Promise<void> {
  // Generate a filename for the download by replacing all non-alphanumeric characters with underscores
  let filename = texture.name.replace(/[^\w]/g, '_') + '.png';

  // Save the output
  let blob = await texture.canvas.toPngBlob();
  saveAs(blob, filename);
}

function onDeleteTexture(texture: Texture): void {
  texture.canvas.dispose();
  textures = textures.filter(t => t !== texture);
  refreshTextureList();
}

/** Helper function for Array.sort() */
function sortByName(obj1: Shader | Texture, obj2: Shader | Texture): number {
  let name1 = obj1.name.toUpperCase();
  let name2 = obj2.name.toUpperCase();

  if (name1 < name2) {
    return -1;
  } else if (name1 > name2) {
    return 1;
  } else {
    return 0;
  }
}
