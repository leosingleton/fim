# Performance Tests

This directory contains samples which measure the library's performance. A few key highlights...

## Reusing textures can improve performance on some devices and/or browsers

All tests show performance of texImage2D() from a 4096x4096 canvas:

| Device           | GPU                          | Browser    | Create/dispose each time | Reuse texture |
| ---------------- | ---------------------------- | ---------- | -------- | -------- |
| 2019 MacBook Pro | Intel Iris Plus Graphics 655 | Chrome 75  |   2.8 ms |   1.2 ms |
| Windows 10 PC    | Intel HD Graphics 630        | Edge       |  26.7 ms |   3.1 ms |
| 2012 MacBook Air | Intel HD Graphics 4000       | Chrome 75  |   4.6 ms |   5.1 ms |
| iPhone XR        | Apple GPU                    | Safari     |  16.5 ms |  16.3 ms |
| iPhone XR        | Apple GPU                    | Chrome     |  16.5 ms |  16.3 ms |
| iPhone SE        | Apple A9 GPU                 | Safari     |  34.7 ms |  34.6 ms |
| 2019 MacBook Pro | Intel Iris Plus Graphics 655 | Safari 12  |  30.3 ms |  29.6 ms |
| 2012 MacBook Air | Intel HD Graphics 4000       | Safari 12  |  60.8 ms |  61.8 ms |
| Windows 10 PC    | Intel HD Graphics 630        | Firefox 61 |  88.6 ms |  71.8 ms |
| Windows 10 PC    | Intel HD Graphics 630        | Chrome 75  | 118.6 ms | 105.5 ms |

## Other Highlights

- Substantial savings in avoiding rescaling when copying textures. The FIM library automatically enables image
  smoothing on all web browsers, which likely results in a large impact.
- The tests show little difference between nearest and linear sampling. Even the built-in GPUs seem to implement linear
  with zero performance hit.
- There was little difference when setting the InputOnly flag on textures
