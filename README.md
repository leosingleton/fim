# FIM - Fast Image Manipulation Library for JavaScript

![CI](https://github.com/leosingleton/fim/workflows/CI/badge.svg)
[![codecov](https://codecov.io/gh/leosingleton/fim/branch/master/graph/badge.svg)](https://codecov.io/gh/leosingleton/fim)
[![npm version](https://badge.fury.io/js/%40leosingleton%2Ffim.svg)](https://badge.fury.io/js/%40leosingleton%2Ffim)

The FIM library provides fast, 2D image manipulation in web browsers and Node.js using WebGL.

## Getting Started

FIM is released as three NPM packages. Install one of the three depending on the use case:

- `npm i @leosingleton/fim-browser` - [fim-browser](https://www.npmjs.com/package/@leosingleton/fim-browser)` contains
  the in-browser implementation of FIM.
- `npm i @leosingleton/fim-node` - [fim-node](https://www.npmjs.com/package/@leosingleton/fim-node) contains a Node.js
  implementation leveraging the [node-canvas](https://github.com/Automattic/node-canvas) and
  [headless-gl](https://github.com/stackgl/headless-gl) projects.
- `npm i @leosingleton/fim` - [fim](https://www.npmjs.com/package/@leosingleton/fim) contains the common implementation
  of FIM and is a dependency of fim-browser and fim-node. NPM packages can take a dependency on this package to create
  packages that are platform-agnostic and let the consumers of the package pick between fim-browser and fim-node.

The `Fim` interface contains the main interface for the library. Using the fim-browser package, it is instantiated with
the factory method:
```
const fim = FimBrowserFactory.create();
```

And in fim-node:
```
const fim = FimNodeFactory.create();
```

For platform-agnostic code, take in a `Fim` instance as a parameter and let the caller instantiate it.

## Images

The primary object in FIM is a `FimImage` and image instances can be created using the methods on the `Fim` interface.
Behind the scenes, FIM manages a mix of 2D and WebGL canvases, plus the underlying WebGL textures and framebuffers so
that an image behaves like a bitmap that can be loaded, copied, saved, and have operations applied to, without worrying
much about the underlying representation.

The primary method for creating images is `Fim.createImage()`:
```
  /**
   * Creates a new image
   * @param dimensions Image dimensions
   * @param options Optional overrides to the image options from the parent Fim object
   * @param name Optional name specified when creating the object to help with debugging
   * @param parent Optional parent object. If unspecified, defaults to the root FIM instance.
   */
  createImage(dimensions: FimDimensions, options?: FimImageOptions, name?: string, parent?: FimObject): TImage;
```

i.e. to create a 1920x1080 image:
```
const image = fim.createImage(FimDimensions.fromWidthHeight(1920, 1080));
```

The image could then be filled with a solid color (such as red):
```
await image.fillSolidAsync('#ff0000');
```

The image data could be loaded from a `Uint8Array` of RGBA values using the `FimImage.loadPixelDataAsync()` method.
The `Fim.createImageFromPngFileAsync()` and `Fim.createImageFromJpegFileAsync()` methods are also useful for
instantiating images directly from an existing PNG or JPEG file.

Once image manipulation is complete, the output can be saved to a `Uint8Array` using either
`FimImage.exportToPixelDataAsync()`, `FimImage.exportToPngAsync()`, or `FimImage.exportToJpegAsync()`. The fim-browser
package adds another method, `FimBrowserImage.exportToCanvasAsync()`, which takes an an `HTMLCanvasElement` as a
parameter and copies the image contents onto the canvas.

## Operations

In FIM, operations for image processing are written as WebGL fragment shaders and exposed as a class derived from the
`FimOperation` base class. WebGL shaders allow FIM to offload processing to the GPU and operate on millions of pixels
an order of magnitude faster than traditional JavaScript code.

FIM includes various built-in operations, which can be found in the
[packages/fim/src/ops](https://github.com/leosingleton/fim/tree/master/packages/fim/src/ops) subdirectory.

Each operation exposes a `$()` method. This method sets the parameters to the operation and returns a `this` reference,
allowing operations to be executed using a single line of code:
```
await OUTPUT_IMAGE.executeAsync(OPERATION.$(/* params */));
```

For instance, following on the 1920x1080 red canvas from above, we could invert the canvas's contents by using the
`FimOpInvert` operation, which takes the input image as a parameter:
```
const invert = new FimOpInvert(fim);
await image.executeAsync(invert.$(image));
```

Note that unlike WebGL textures, FIM allows an operation to have a single image used as both an input and an output
parameter. FIM automatically manages any temporary objects needed to make it work.

With some basic knowledge of GLSL, custom operations may be added by writing a fragment shader, compiling it with
[webpack-glsl-minify](https://github.com/leosingleton/webpack-glsl-minify), then creating a class derived from
`FimOperationShader` to set the shader's constants and uniforms for a simple, single pass shader. `FimOpDarker` and
`FimOpLighter` are good examples to get started.

More complex operations involving multiple passes will need to derive from `FimOperation` directly. The operation can
either manage instances WebGL shader instances manually using `Fim.createGLShader()`, or it can compose other
`FimOperation` instances to create multi-pass operations.

## Resource Management

FIM can consume substantial memory and GPU resources, and unlike typical JavaScript code, these resources are not
automatically garbage collected. Instead, each object in FIM exposes a `dispose()` method that can be called to dispose
the object. Note that disposing is recursive--e.g. simply calling `dispose()` on the root `Fim` instance will also
dispose any images and operations created by FIM.

Some GPUs, particularly on mobile devices, may also have lower capabilities in terms of maximum resolution or bits per
pixel. FIM will automatically downscale images to remain within the GPU's stated capabilities. FIM exposes the
capabilities of the current GPU and WebGL implementation on the `Fim.capabilities` property.

## GPU Context Loss

Finally, although FIM does its best to hide the details of GPU programming and WebGL, consumers do still have to worry
to some extent about WebGL context loss. Context loss occurs when the GPU runs out of resources and the browser or
operating system decides to take away GPU resources from one program to give them to another. Most frequently, this
occurs in browser tabs which are no longer in the foreground, but could happen at any time.

To handle context loss, FIM automatically recreates any WebGL resources automatically, however the contents of images
are likely to get lost in this process. The FIM library provides four mechanisms to help programs deal with this:

1. A program may call `FimImage.backupAsync()` to back up any image data stored in GPU memory. When the GPU context is
   restored, the image contents will be reloaded from the latest backup. Note that the process of taking a backup does
   incur significant performance overhead, so should be used sparingly.

2. Instead of explicitly calling `backupAsync()`, the `FimImageOptions.autoBackup` property may be enabled to
   automatically take a backup after every operation that writes its output to the image. Note that this also incurs a
   significant performance overhead, so should be used sparingly.

3. When `FimImageOptions.defaultFillColor` is configured, the contents of an image are initialized to the requested
   solid color.

4. Programs may register their own handlers with `Fim.registerContextLostHandler()` and
   `Fim.registerContextRestoredHandler()` to implement their own recovery behavior.

## Samples
- [Unsharp Mask](https://fim.leosingleton.com/samples/unsharp-mask.html)
- [Gaussian Blur](https://fim.leosingleton.com/samples/gaussian-blur.html)
- [Brightness/Contrast Adjustments](https://fim.leosingleton.com/samples/brightness-contrast.html)
- [2D Transformations](https://fim.leosingleton.com/samples/transform2d.html)
- [3D Transformations](https://fim.leosingleton.com/samples/transform3d.html)
- [Display Capabilities](https://fim.leosingleton.com/samples/capabilities.html) - Displays the output of
  `fim.capabilities` in the current web browser.
- [WebGL Sandbox](https://fim.leosingleton.com/webgl-sandbox/) - Simple UI for creating, testing, and debugging GLSL
  fragment shaders in a web browser. It works much like [Shadertoy](https://www.shadertoy.com) or
  [GLSL Sandbox](http://glslsandbox.com/) and allows, however, unlike the others which focus primarily on animated
  demoscenes, WebGL Sandbox provides minimal framework allowing testing of existing GLSL shaders, including creating
  uniforms and importing existing JPEG or PNG images as textures. This is particularly useful for testing new 2D image
  filters.

## License
Copyright (c) 2016-2020 [Leo C. Singleton IV](https://www.leosingleton.com/).
This software is licensed under the MIT License.
