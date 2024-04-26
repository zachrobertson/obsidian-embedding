# Obsidian Embedding Plugin

Obsidian Plugin for embedding based search and visualization

## Common issues

- Using node.js v20 there is an issue with `ts-node` running standalone `.ts` files, instead you should use the following command node command instead of yarn
  - `node --loader ts-node/esm {file}`
- If you want to run a file that uses local imports it is easiest to transpile the `.ts` file to a `.cjs` file (must be commonJS to avoid issues with `package.json` type configuration) and running that file directly with node
  - `yarn tsc {file}.ts && mv {file}.js {file}.cjs && node {file}.cjs` (*Note: This may require that import statements are updated to point to the new .cjs files and any linked files that were transpiled also have their file extension changed to cjs*)

## Using Llama locally

The llama server is from [llama.cpp](https://github.com/ggerganov/llama.cpp) and compiled for windows and linux. The weights are provided by llama.cpp as well, using the `quantize` routine.

### Generating quantized model weights

`Note: There are a ton of gguf models already quantized on hugging face, it might be easier to check their first instead of building llama.cpp`

- `llama2`
  - Get llama2 access from Meta
    - Refer to the [meta llama downloads page](https://llama.meta.com/llama-downloads/)
  - Build llama.cpp for your environment to generate the `quantize` program
  - Place the model weights from Meta in the `./models` directory
  - Install python dependencies, `pip install -r requirements.txt`
  - Convert model to ggml FP16 format, `python convert.py models/<model-directory>`
  - Quantize model (refer to llama.cpp docs for more information if you want to modify the given quantization strategy), `./quantize ./models/<model-directory>/ggml-model-f16.gguf ./models/<model-directory>/ggml-model-Q4_K_M.gguf Q4_K_M`

- `mixtral`
  - *TODO*
