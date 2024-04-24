# Obsidian Embedding Plugin

## TODO

- ~~Finish dimension reduction method~~
  - ~~Should I use `svd.ts`? or just use a library that can do this for me?~~
    - ~~Using custom SVD and PCA implementation for now, should test against other methods~~

- Test dimension reduction techniques
- Update dimension reduction system so that new vectors can be added to the database without having to recalculate all reduced vectors for the whole database
- Add annotations and cursor highlighting to embedding graph view
- Add KNN query search on vector database
- Generally all questions need to be asked in a global "context", this is true with coding assistants as well

## Common issues

- Using node.js v20 there is an issue with `ts-node` running standalone `.ts` files, instead you should use the following command node command instead of yarn
  - `node --loader ts-node/esm {file}`
- If you want to run a file that uses local imports it is easiest to transpile the `.ts` file to a `.cjs` file (must be commonJS to avoid issues with `package.json` type configuration) and running that file directly with node
  - `yarn tsc {file}.ts && mv {file}.js {file}.cjs && node {file}.cjs` (*Note: This may require that import statements are updated to point to the new .cjs files and any linked files that were transpiled also have their file extension changed to cjs*)

## Using Llama locally

TODO: need to make documentation for pulling llama weights and generating quantized models, can also point to hugging face models
