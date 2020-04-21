# Property mangling with terser

FIM supports the `--mangle-props` minification option on [terser](https://github.com/terser/terser), however the
following built-in DOM properties must be explicitly disabled:

- `HALF_FLOAT_OES`
- `OffscreenCanvas`
- `convertToBlob`
- `deviceMemory`
- `imageSmoothingEnabled`
- `loseContext`
- `restoreContext`
