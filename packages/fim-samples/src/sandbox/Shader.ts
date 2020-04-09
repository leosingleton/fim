// WebGL Sandbox
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { fim } from './Common';
import { deepCopy, usingAsync } from '@leosingleton/commonlibs';
import { GlslShader } from 'webpack-glsl-minify';
import { GlslMinify } from 'webpack-glsl-minify/build/minify.js';

export class Shader {
  public constructor(name: string, sourceCode: string, idOrOldShader?: number | Shader) {
    let id: number;
    if (typeof idOrOldShader === 'number') {
      id = idOrOldShader;
    } else if (typeof idOrOldShader === 'object') {
      id = idOrOldShader.id;
      this.executionCount = idOrOldShader.executionCount;
    } else {
      id = ++Shader.idCount;
    }

    // When loading from localStorage, also increment the next ID
    if (id > Shader.idCount) {
      Shader.idCount = id;
    }

    this.id = id;
    this.name = name;
    this.sourceCode = sourceCode;

    if (typeof idOrOldShader === 'object') {
      this.values = deepCopy(idOrOldShader.values);
      this.linearFiltering = deepCopy(idOrOldShader.linearFiltering);
    } else {
      this.values = {};
      this.linearFiltering = {};
    }
  }

  public async compile(): Promise<void> {
    // Use webpack-glsl-minify to parse the source code
    const minify = new GlslMinify({
      preserveDefines: true,
      preserveUniforms: true,
      preserveVariables: true
    });
    this.shader = await minify.execute(this.sourceCode);

    // Try to compile the shader
    await usingAsync(fim.createGLShader(this.shader), async shader => {
      // Populate any @const values with some value to keep the WebGL compiler happy
      const consts = this.shader.consts;
      for (const cname in consts) {
        shader.setConstant(consts[cname].variableName, 1);
      }

      await shader.compileAsync();
    });
  }

  public writeToLocalStorage(): void {
    localStorage.setItem(`shader_${this.id}_name`, this.name);
    localStorage.setItem(`shader_${this.id}_source`, this.sourceCode);

    // Save constant and uniform values
    for (const vname in this.values) {
      const value = this.values[vname];
      localStorage.setItem(`shader_${this.id}_${vname}`, value);
    }
    for (const uname in this.linearFiltering) {
      const value = this.linearFiltering[uname];
      localStorage.setItem(`shader_${this.id}_${uname}_linear`, value.toString());
    }
  }

  public deleteFromLocalStorage(): void {
    for (const key in localStorage) {
      if (key.indexOf(`shader_${this.id}_`) === 0) {
        localStorage.removeItem(key);
      }
    }
  }

  public readonly id: number;
  public readonly name: string;
  public readonly sourceCode: string;
  public shader: GlslShader;
  public executionCount = 0;

  /** Maps the ID of an element in the UI (i.e. "uniform-name") to its value */
  public values: { [id: string]: string };

  /** Maps the ID of a sampler2D uniform (i.e. "uniform-name") to the value of the enable linear filtering boolean */
  public linearFiltering: { [id: string]: boolean };

  public static async createFromFile(file: File): Promise<Shader> {
    const shader = await this.createFromFileHelper(file);
    await shader.compile();
    return shader;
  }

  private static createFromFileHelper(file: File): Promise<Shader> {
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.readAsText(file);

      // On success, create a Shader and return it via the Promise
      fr.onload = () => {
        const source = fr.result as string;
        const shader = new Shader(file.name, source);
        resolve(shader);
      };

      // On error, return an exception via the Promise
      fr.onerror = err => {
        reject(err);
      };
    });
  }

  public static async createFromLocalStorage(id: number): Promise<Shader> {
    const name = localStorage.getItem(`shader_${id}_name`);
    const source = localStorage.getItem(`shader_${id}_source`);

    // Create the shader
    const shader = new Shader(name, source, id);
    await shader.compile();

    // Load constant values
    for (const cname in shader.shader.consts) {
      const cid = `const-${cname}`;
      const value = localStorage.getItem(`shader_${id}_${cid}`);
      shader.values[cid] = value || '';
    }

    // Load uniform values
    for (const uname in shader.shader.uniforms) {
      const uid = `uniform-${uname}`;
      const value = localStorage.getItem(`shader_${id}_${uid}`);
      shader.values[uid] = value || '';

      const linear = localStorage.getItem(`shader_${id}_${uid}_linear`);
      shader.linearFiltering[uid] = (linear === 'true');
    }

    return shader;
  }

  public static async createAllFromLocalStorage(): Promise<Shader[]> {
    const shaders: Shader[] = [];

    for (let n = 0; n < localStorage.length; n++) {
      const key = localStorage.key(n);
      const parts = key.split('_');
      if (parts.length === 3 && parts[0] === 'shader' && parts[2] === 'name') {
        // We found a shader
        const id = Number.parseInt(parts[1]);
        shaders.push(await this.createFromLocalStorage(id));
      }
    }

    return shaders;
  }

  private static idCount = 0;
}
