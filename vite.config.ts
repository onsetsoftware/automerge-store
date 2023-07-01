/// <reference types="vitest" />

import { defineConfig } from "vite";
import wasm from "vite-plugin-wasm";
import path from "path";
import dts from "vite-plugin-dts";
import topLevelAwait from "vite-plugin-top-level-await";
import { externalizeDeps } from "vite-plugin-externalize-deps";

const resolvePath = (str: string) => path.resolve(__dirname, str);

export default defineConfig({
  plugins: [
    externalizeDeps(),
    topLevelAwait(),
    wasm(),
    dts({
      entryRoot: resolvePath("src"),
      outDir: resolvePath("dist/types"),
    }),
  ],
  optimizeDeps: {
    exclude: ["@automerge/automerge-wasm"],
  },
  build: {
    target: "esnext",
    lib: {
      entry: resolvePath("src/index.ts"),
      name: "AutomergeStore",
      fileName: `automerge-store`,
    },
    rollupOptions: {
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      external: ["@automerge/automerge"],
      output: {
        // Provide global variables to use in the UMD build
        // for externalized deps
        globals: {
          "@automerge/automerge": "Automerge",
        },
      },
    },
  },
});
