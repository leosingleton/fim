# Document to track the valid operations when calling `FimImage.copyFrom()`

X = Copy
C = Crop
S = Scale

| Destination     | Canvas | GLCanvas | GLTexture | GreyscaleBuffer | RgbaBuffer |
|-----------------|:------:|:--------:|:---------:|:---------------:|:----------:|
| Canvas          | X+C+S  | X+C+S    |           |                 | X+C        |
| GLCanvas        |        |          |           |                 |            |
| GLTexture       | X      |          |           | X               | X          |
| GreyscaleBuffer |        |          |           | X+C             |            |
| RgbaBuffer      | X+C    |          |           | X+C             | X+C        |
