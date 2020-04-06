// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

import { canvasOptions, textureOptions } from '../../common/CoreOptions';
import { TestColors } from '../../common/TestColors';
import { TestSizes } from '../../common/TestSizes';
import { using } from '@leosingleton/commonlibs';
import { FimDimensions } from '@leosingleton/fim';
import { CoreCanvasOptions, CoreCanvasWebGL } from '@leosingleton/fim/internals';

/** CoreCanvasWebGL test cases for create/dispose */
export function coreCanvasWebGLTestSuiteCreateDispose(
  description: string,
  factory: (dimensions: FimDimensions, canvasOptions: CoreCanvasOptions) => CoreCanvasWebGL
): void {
  describe(`CoreCanvasWebGL Create/Dispose - ${description}`, () => {

    it('Creates and disposes', () => {
      const canvas = factory(TestSizes.smallWide, canvasOptions);
      canvas.dispose();
      expect(() => canvas.dispose()).toThrow(); // Double dispose throws exception
    });

    it('Automatically disposes shaders', () => {
      const canvas = factory(TestSizes.smallWide, canvasOptions);
      const source = require('../../glsl/FillUniform.glsl.js');
      const shader = canvas.createCoreShader(source);
      canvas.dispose();
      expect(() => shader.dispose()).toThrow(); // Shader is automatically disposed by WebGL canvas
    });

    it('Automatically disposes textures', () => {
      const canvas = factory(TestSizes.smallWide, canvasOptions);
      const texture = canvas.createCoreTexture(TestSizes.smallWide, textureOptions);
      canvas.dispose();
      expect(() => texture.dispose()).toThrow(); // Texture is automatically disposed by WebGL canvas
    });

    it('Automatically disposes built-in shaders', () => {
      const canvas = factory(TestSizes.smallWide, canvasOptions);
      const copyShader = canvas.getCopyShader();
      const fillShader = canvas.getFillShader();
      canvas.dispose();
      expect(() => copyShader.dispose()).toThrow(); // Shader is automatically disposed by WebGL canvas
      expect(() => fillShader.dispose()).toThrow(); // Shader is automatically disposed by WebGL canvas
    });

    it('Does not automatically disposes temporary canvases', () => {
      const canvas = factory(TestSizes.smallWide, canvasOptions);
      const temp = canvas.createTemporaryCanvas2D();
      canvas.dispose();

      // Temporary canvas IS NOT automatically disposed by WebGL canvas
      temp.fillSolid(TestColors.red);
      temp.dispose();
    });

    it('getContext() stress', () => {
      using(factory(TestSizes.largeWide, canvasOptions), canvas => {
        for (let n = 0; n < 100; n++) {
          canvas.fillSolid(TestColors.red);
          const gl = canvas.getContext();
          expect(gl.isContextLost()).toBeFalsy();
        }
      });
    });

    it('Create/dispose stress', () => {
      for (let n = 0; n < 100; n++) {
        using(factory(TestSizes.largeWide, canvasOptions), canvas => {
          canvas.fillSolid(TestColors.red);
          const texture = canvas.createCoreTexture(TestSizes.largeWide, textureOptions);
          texture.fillSolid(TestColors.red);
        });
      }
    });

  });
}
