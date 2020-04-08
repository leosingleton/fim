// WebGL Sandbox
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { IPerformanceResults, perfTest, fim } from './Common';
import { Program } from './Program';
import { createSampleShaders } from './SampleShaders';
import { SelectChannelProgram } from './SelectChannel';
import { Shader } from './Shader';
import { Texture } from './Texture';
import { DisposableSet } from '@leosingleton/commonlibs';
import { FimCanvas, FimGLTextureOptions, FimGLTextureFlags } from '@leosingleton/fim';
import { saveAs } from 'file-saver';
import { GlslVariable } from 'webpack-glsl-minify';
import $ from 'jquery';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

$(async () => {
  // Load previous shaders from local storage on startup
  shaders = await Shader.createAllFromLocalStorage();

  // If there are no shaders in local storage, populate the app with some sample ones to get started
  if (shaders.length === 0) {
    shaders = await createSampleShaders();

    // Write the sample shaders to local storage
    for (const shader of shaders) {
      shader.writeToLocalStorage();
    }
  }

  refreshShaderList();
});

export namespace Editor {
  export function addShader(): void {
    onEditShader();
  }

  export async function addShaderOk(): Promise<void> {
    try {
      const name = $('#add-shader-name').val().toString();
      if (!name) {
        throw new Error('Name is required');
      }

      const source = $('#add-shader-source').val().toString();
      if (!source) {
        throw new Error('Source code is required');
      }

      const shader = new Shader(name, source, currentShader);
      await shader.compile();
      shader.writeToLocalStorage();

      shaders = shaders.filter(s => s !== currentShader);
      shaders.push(shader);
      refreshShaderList();

      $('#add-shader').modal('hide');
    } catch (err) {
      $('#add-shader-errors').text(err);
      $('#add-shader-errors').show();
    }
  }

  /** Handler for the 'Run Performance Test' button in the execute shader dialog */
  export async function executePerformanceTest(): Promise<void> {
    try {
      const results = await runCurrentShader(true) as IPerformanceResults;
      $('#performance-results-body').text(results.message);
      $('#performance-results').modal('show');
    } catch (err) {
      $('#execute-shader-errors').text(err);
      $('#execute-shader-errors').show();
    }
  }

  /** Handler for the OK button in the execute shader dialog */
  export async function executeShaderOk(): Promise<void> {
    try {
      const canvas = await runCurrentShader() as FimCanvas;
      currentShader.executionCount++;

      const textureName = $('#execute-shader-name').val().toString();
      const texture = new Texture(textureName, canvas);
      textures.push(texture);
      refreshTextureList();

      $('#execute-shader').modal('hide');
    } catch (err) {
      $('#execute-shader-errors').text(err);
      $('#execute-shader-errors').show();
    }
  }

  export async function uploadShaders(files: FileList): Promise<void> {
    for (const file of files) {
      shaders.push(await Shader.createFromFile(file));
    }
    refreshShaderList();
  }

  export async function uploadTextures(files: FileList): Promise<void> {
    for (const file of files) {
      textures.push(await Texture.createFromFile(file));
    }
    refreshTextureList();
  }
}

let shaders: Shader[] = [];

function refreshShaderList(): void {
  // Sort alphabetically by name
  shaders = shaders.sort(sortByName);

  $('#shaders tr').remove();
  for (const shader of shaders) {
    const row = $('<tr/>').appendTo('#shaders');
    row.append($('<td/>').text(shader.name));

    const actions = $('<td/>').appendTo(row);
    actions.append($('<a href="#">Execute</a>').click(() => onExecuteShader(shader)));
    actions.append(' | ');
    actions.append($('<a href="#">Edit</a>').click(() => onEditShader(shader)));
    actions.append(' | ');
    actions.append($('<a href="#">Delete</a>').click(() => onDeleteShader(shader)));
  }
}

let currentShader: Shader = null;

/** Displays the execute shader dialog box */
function onExecuteShader(shader: Shader): void {
  currentShader = shader;
  const s = shader.shader;

  // Initialize the name of the texture
  const textureName = `Output of ${shader.name} ${shader.executionCount + 1}`;
  $('#execute-shader-name').val(textureName);

  // Remove all previous edit controls
  $('#execute-shader-form div').remove();

  // Add edit controls for consts
  for (const cname in s.consts) {
    const c = s.consts[cname] as GlslVariable;
    const id = `const-${cname}`;
    const text = `${cname} (${c.variableType})`;
    const value = shader.values[id];

    const group = $('<div class="form-group"/>').appendTo('#execute-shader-form');
    group.append($('<label class="control-label"/>').attr('for', id).text(text));
    group.append($('<input type="text" class="form-control"/>').attr('id', id).val(value || ''));
  }

  // Add edit controls for uniforms
  for (const uname in s.uniforms) {
    const u = s.uniforms[uname] as GlslVariable;
    const id = `uniform-${u.variableName}`;
    const text = `${u.variableName} (${u.variableType})`;
    const value = shader.values[id];

    const group = $('<div class="form-group py-2"/>').appendTo('#execute-shader-form');
    group.append($('<label class="control-label"/>').attr('for', id).text(text));
    if (u.variableType.indexOf('sampler') === -1) {
      group.append($('<input type="text" class="form-control"/>').attr('id', id).val(value || ''));
    } else {
      // sampler2D uniforms are special: We show a drop-down of textures instead
      const select = $('<select class="form-control"/>').attr('id', id).appendTo(group);
      for (const texture of textures) {
        const name = `${texture.name} (${texture.canvas.w} x ${texture.canvas.h})`;
        select.append($('<option/>').attr('value', texture.id).text(name));
      }

      // Set the default selected option
      if (value) {
        select.val(value);
      }

      // Also show a checkbox to enable linear sampling
      const check = $('<div class="form-check"/>').appendTo(group);
      const checkId = `linear-${u.variableName}`;
      check.append($('<input type="checkbox" class="form-check-input"/>').attr('id', checkId).prop('checked',
        shader.linearFiltering[id]));
      check.append($('<label class="form-check-label"/>').attr('for', checkId).text('Enable linear filtering'));
    }
  }

  $('#execute-shader-errors').hide();
  $('#execute-shader').modal('show');
}

/** Handles the OK button on the execute shader dialog */
function runCurrentShader(performanceTest = false): FimCanvas | IPerformanceResults {
  const s = currentShader.shader;
  let result: FimCanvas | IPerformanceResults;

  const width = $('#execute-shader-width').val() as number;
  const height = $('#execute-shader-height').val() as number;

  DisposableSet.using(disposable => {
    const gl = disposable.addDisposable(fim.createGLCanvas(width, height));
    const program = disposable.addDisposable(new Program(gl, s));

    for (const cname in s.consts) {
      const id = `#const-${cname}`;
      // eslint-disable-next-line no-eval
      const value = eval($(id).val().toString());
      program.setConst(cname, value);
    }

    for (const uname in s.uniforms) {
      const u = s.uniforms[uname];
      const id = `#uniform-${u.variableName}`;
      // eslint-disable-next-line no-eval
      const value = eval($(id).val().toString());
      if (u.variableType.indexOf('sampler') === -1) {
        program.setUniform(uname, value);
      } else {
        const canvas = textures.find(v => v.id === value).canvas;
        const linear = $(`#linear-${u.variableName}`).prop('checked') as boolean;
        const options: FimGLTextureOptions = linear ? { textureFlags: FimGLTextureFlags.LinearSampling } : {};
        const inputTexture = disposable.addDisposable(gl.createTexture(canvas.w, canvas.h, options));
        inputTexture.copyFrom(canvas);
        program.setUniform(uname, inputTexture);
      }
    }

    // Recompile the shader as the @const values may have changed
    program.compileProgram();

    if (performanceTest) {
      result = perfTest(currentShader.name, () => program.execute());
    } else {
      program.execute();
      result = gl.duplicateCanvas();
    }
  });

  // On success, store the values for the next time the execute dialog is opened for this shader
  for (const cname in s.consts) {
    const id = `const-${cname}`;
    currentShader.values[id] = $(`#${id}`).val().toString();
  }

  for (const uname in s.uniforms) {
    const id = `uniform-${uname}`;
    currentShader.values[id] = $(`#${id}`).val().toString();

    const linear = $(`#linear-${uname}`).prop('checked');
    if (linear !== undefined) {
      currentShader.linearFiltering[id] = linear;
    }
  }

  // Persist any const or uniform values in local storage
  currentShader.writeToLocalStorage();

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
  shader.deleteFromLocalStorage();
}

let textures: Texture[] = [];

function refreshTextureList(): void {
  // Sort alphabetically by name
  textures = textures.sort(sortByName);

  $('#textures tr').remove();
  for (const texture of textures) {
    const row = $('<tr/>').appendTo('#textures');
    if (!texture.isRenaming) {
      row.append($('<td/>').text(texture.name));
    } else {
      // When renaming, the name becomes an edit box
      row.append($('<td/>').append($('<input type="text" id="rename-texture" class="form-control"/>')
        .val(texture.name).focusout(() => onRenameTextureDone(texture))));
    }

    // Dimensions column
    row.append($('<td/>').html(`${texture.canvas.w}&nbsp;x&nbsp;${texture.canvas.h}`));

    const actions = $('<td/>').appendTo(row);
    actions.append($('<a href="#">View</a>').click(() => onViewTexture(texture)));
    actions.append('&nbsp;(');
    actions.append($('<a href="#">R</a>').click(() => onViewTextureChannel(texture, 'R')));
    actions.append('&nbsp;');
    actions.append($('<a href="#">G</a>').click(() => onViewTextureChannel(texture, 'G')));
    actions.append('&nbsp;');
    actions.append($('<a href="#">B</a>').click(() => onViewTextureChannel(texture, 'B')));
    actions.append('&nbsp;');
    actions.append($('<a href="#">A</a>').click(() => onViewTextureChannel(texture, 'A')));
    actions.append(') | ');
    actions.append($('<a href="#">Download</a>').click(() => onDownloadTexture(texture)));
    actions.append(' | ');
    actions.append($('<a href="#">Rename</a>').click(() => onRenameTexture(texture)));
    actions.append(' | ');
    actions.append($('<a href="#">Delete</a>').click(() => onDeleteTexture(texture)));
  }
}

/** Called when the button to rename a texture is clicked. Changes the name to an edit box. */
function onRenameTexture(texture: Texture): void {
  texture.isRenaming = true;
  refreshTextureList();
}

/** Called when the edit box to rename a texture loses focus. Performs the actual rename. */
function onRenameTextureDone(texture: Texture): void {
  const name = $('#rename-texture').val().toString();
  const newTexture = new Texture(name, texture.canvas);
  textures = textures.filter(t => t !== texture);
  textures.push(newTexture);
  refreshTextureList();
}

function onViewTexture(texture: Texture): Promise<void> {
  return onViewCanvas(texture.canvas);
}

async function onViewCanvas(canvas: FimCanvas): Promise<void> {
  const blob = await canvas.toPngBlob();

  const fr = new FileReader();
  fr.readAsDataURL(blob);
  fr.onload = () => {
    const img = new Image();
    img.src = fr.result as string;

    const popup = window.open('');
    popup.document.write(img.outerHTML);
  };
}

function onViewTextureChannel(texture: Texture, channel: 'R' | 'G' | 'B' | 'A'): Promise<void> {
  let result: Promise<void>;
  DisposableSet.using(disposable => {
    const oldCanvas = texture.canvas;
    const gl = disposable.addDisposable(fim.createGLCanvas(oldCanvas.w, oldCanvas.h));
    const tex = disposable.addDisposable(gl.createTextureFrom(oldCanvas));
    const p = disposable.addDisposable(new SelectChannelProgram(gl));
    p.setInputs(tex, channel);
    p.execute();

    const newCanvas = disposable.addDisposable(gl.duplicateCanvas());
    result = onViewCanvas(newCanvas);
  });

  return result;
}

/** Handler for the Download button */
async function onDownloadTexture(texture: Texture): Promise<void> {
  // Generate a filename for the download by replacing all non-alphanumeric characters with underscores
  const filename = texture.name.replace(/[^\w]/g, '_') + '.png';

  // Save the output
  const blob = await texture.canvas.toPngBlob();
  saveAs(blob, filename);
}

function onDeleteTexture(texture: Texture): void {
  texture.canvas.dispose();
  textures = textures.filter(t => t !== texture);
  refreshTextureList();
}

/** Helper function for Array.sort() */
function sortByName(obj1: Shader | Texture, obj2: Shader | Texture): number {
  const name1 = obj1.name.toUpperCase();
  const name2 = obj2.name.toUpperCase();

  if (name1 < name2) {
    return -1;
  } else if (name1 > name2) {
    return 1;
  } else {
    return 0;
  }
}
