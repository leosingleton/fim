// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { large, red, small } from '../../common/Globals';
import { using } from '@leosingleton/commonlibs';
import { FimDimensions } from '@leosingleton/fim';
import { CoreCanvasWebGL } from '@leosingleton/fim/internals';

/** CoreCanvasWebGL test cases for create/dispose */
export function coreCanvasWebGLTestSuiteCreateDispose(
  description: string,
  factory: (dimensions: FimDimensions) => CoreCanvasWebGL
): void {
  describe(`CoreCanvasWebGL Create/Dispose - ${description}`, () => {

    it('Creates and disposes', () => {
      const canvas = factory(small);
      canvas.dispose();
      expect(() => canvas.dispose()).toThrow(); // Double dispose throws exception
    });

    it('Automatically disposes shaders', () => {
      const canvas = factory(small);
      const source = require('../../../build/core/CoreCanvasWebGL/glsl/Fill.glsl.js');
      const shader = canvas.createCoreShader(source);
      canvas.dispose();
      expect(() => shader.dispose()).toThrow(); // Shader is automatically disposed by WebGL canvas
    });

    it('Automatically disposes textures', () => {
      const canvas = factory(small);
      const texture = canvas.createCoreTexture();
      canvas.dispose();
      expect(() => texture.dispose()).toThrow(); // Texture is automatically disposed by WebGL canvas
    });

    it('Automatically disposes built-in shaders', () => {
      const canvas = factory(small);
      const copyShader = canvas.getCopyShader();
      const fillShader = canvas.getFillShader();
      canvas.dispose();
      expect(() => copyShader.dispose()).toThrow(); // Shader is automatically disposed by WebGL canvas
      expect(() => fillShader.dispose()).toThrow(); // Shader is automatically disposed by WebGL canvas
    });

    it('Does not automatically disposes temporary canvases', () => {
      const canvas = factory(small);
      const temp = canvas.createTemporaryCanvas2D();
      canvas.dispose();

      // Temporary canvas IS NOT automatically disposed by WebGL canvas
      temp.fillSolid(red);
      temp.dispose();
    });

    it('getContext() stress', () => {
      using(factory(large), canvas => {
        for (let n = 0; n < 100; n++) {
          canvas.fillSolid(red);
          const gl = canvas.getContext();
          expect(gl.isContextLost()).toBeFalsy();
        }
      });
    });

    it('Create/dispose stress', () => {
      for (let n = 0; n < 100; n++) {
        using(factory(large), canvas => {
          canvas.fillSolid(red);
          const texture = canvas.createCoreTexture();
          texture.fillSolid(red);
        });
      }
    });

  });
}
