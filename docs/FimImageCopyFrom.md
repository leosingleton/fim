# Document to track the valid operations when calling `FimImage.copyFrom()`

X = Copy
C = Crop
S = Scale

| Destination | Canvas | RgbaBuffer |
|-------------|:------:|:----------:|
| Canvas      | X+C+S  | X+C        |
| RgbaBuffer  | X+C    | X+C        |
