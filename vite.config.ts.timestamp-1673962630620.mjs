// vite.config.ts
import { defineConfig } from "file:///Users/acurrieclark/Development/packages/npm/automerge-store/node_modules/vite/dist/node/index.js";
import wasm from "file:///Users/acurrieclark/Development/packages/npm/automerge-store/node_modules/vite-plugin-wasm/exports/import.mjs";
import path from "path";
import dts from "file:///Users/acurrieclark/Development/packages/npm/automerge-store/node_modules/vite-plugin-dts/dist/index.mjs";
import topLevelAwait from "file:///Users/acurrieclark/Development/packages/npm/automerge-store/node_modules/vite-plugin-top-level-await/exports/import.mjs";
var __vite_injected_original_dirname = "/Users/acurrieclark/Development/packages/npm/automerge-store";
var resolvePath = (str) => path.resolve(__vite_injected_original_dirname, str);
var vite_config_default = defineConfig({
  plugins: [
    topLevelAwait(),
    wasm(),
    dts({
      entryRoot: resolvePath("src"),
      outputDir: resolvePath("dist/types")
    })
  ],
  optimizeDeps: {
    exclude: ["@automerge/automerge-wasm"]
  },
  resolve: {
    alias: {
      "@onsetsoftware/automerge-patcher": resolvePath(
        "./node_modules/@onsetsoftware/automerge-patcher/src"
      ),
      "@automerge/automerge": resolvePath(
        "./node_modules/@onsetsoftware/automerge-patcher/node_modules/@automerge/automerge"
      )
    }
  },
  build: {
    target: "esnext",
    lib: {
      entry: resolvePath("src/index.ts"),
      name: "AutomergeStore",
      fileName: (format) => `automerge-store.${format}.js`
    },
    rollupOptions: {
      external: ["@automerge/automerge"],
      output: {
        globals: {
          "@automerge/automerge": "Automerge"
        }
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvYWN1cnJpZWNsYXJrL0RldmVsb3BtZW50L3BhY2thZ2VzL25wbS9hdXRvbWVyZ2Utc3RvcmVcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9Vc2Vycy9hY3VycmllY2xhcmsvRGV2ZWxvcG1lbnQvcGFja2FnZXMvbnBtL2F1dG9tZXJnZS1zdG9yZS92aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVXNlcnMvYWN1cnJpZWNsYXJrL0RldmVsb3BtZW50L3BhY2thZ2VzL25wbS9hdXRvbWVyZ2Utc3RvcmUvdml0ZS5jb25maWcudHNcIjsvLy8gPHJlZmVyZW5jZSB0eXBlcz1cInZpdGVzdFwiIC8+XG5cbmltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gXCJ2aXRlXCI7XG5pbXBvcnQgd2FzbSBmcm9tIFwidml0ZS1wbHVnaW4td2FzbVwiO1xuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcbmltcG9ydCBkdHMgZnJvbSBcInZpdGUtcGx1Z2luLWR0c1wiO1xuaW1wb3J0IHRvcExldmVsQXdhaXQgZnJvbSBcInZpdGUtcGx1Z2luLXRvcC1sZXZlbC1hd2FpdFwiO1xuXG5jb25zdCByZXNvbHZlUGF0aCA9IChzdHI6IHN0cmluZykgPT4gcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgc3RyKTtcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgcGx1Z2luczogW1xuICAgIHRvcExldmVsQXdhaXQoKSxcbiAgICB3YXNtKCksXG4gICAgZHRzKHtcbiAgICAgIGVudHJ5Um9vdDogcmVzb2x2ZVBhdGgoXCJzcmNcIiksXG4gICAgICBvdXRwdXREaXI6IHJlc29sdmVQYXRoKFwiZGlzdC90eXBlc1wiKSxcbiAgICB9KSxcbiAgXSxcbiAgb3B0aW1pemVEZXBzOiB7XG4gICAgZXhjbHVkZTogW1wiQGF1dG9tZXJnZS9hdXRvbWVyZ2Utd2FzbVwiXSxcbiAgfSxcbiAgcmVzb2x2ZToge1xuICAgIGFsaWFzOiB7XG4gICAgICBcIkBvbnNldHNvZnR3YXJlL2F1dG9tZXJnZS1wYXRjaGVyXCI6IHJlc29sdmVQYXRoKFxuICAgICAgICBcIi4vbm9kZV9tb2R1bGVzL0BvbnNldHNvZnR3YXJlL2F1dG9tZXJnZS1wYXRjaGVyL3NyY1wiXG4gICAgICApLFxuICAgICAgXCJAYXV0b21lcmdlL2F1dG9tZXJnZVwiOiByZXNvbHZlUGF0aChcbiAgICAgICAgXCIuL25vZGVfbW9kdWxlcy9Ab25zZXRzb2Z0d2FyZS9hdXRvbWVyZ2UtcGF0Y2hlci9ub2RlX21vZHVsZXMvQGF1dG9tZXJnZS9hdXRvbWVyZ2VcIlxuICAgICAgKSxcbiAgICB9LFxuICB9LFxuICBidWlsZDoge1xuICAgIHRhcmdldDogXCJlc25leHRcIixcbiAgICBsaWI6IHtcbiAgICAgIGVudHJ5OiByZXNvbHZlUGF0aChcInNyYy9pbmRleC50c1wiKSxcbiAgICAgIG5hbWU6IFwiQXV0b21lcmdlU3RvcmVcIixcbiAgICAgIGZpbGVOYW1lOiAoZm9ybWF0KSA9PiBgYXV0b21lcmdlLXN0b3JlLiR7Zm9ybWF0fS5qc2AsXG4gICAgfSxcbiAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICAvLyBtYWtlIHN1cmUgdG8gZXh0ZXJuYWxpemUgZGVwcyB0aGF0IHNob3VsZG4ndCBiZSBidW5kbGVkXG4gICAgICAvLyBpbnRvIHlvdXIgbGlicmFyeVxuICAgICAgZXh0ZXJuYWw6IFtcIkBhdXRvbWVyZ2UvYXV0b21lcmdlXCJdLFxuICAgICAgb3V0cHV0OiB7XG4gICAgICAgIC8vIFByb3ZpZGUgZ2xvYmFsIHZhcmlhYmxlcyB0byB1c2UgaW4gdGhlIFVNRCBidWlsZFxuICAgICAgICAvLyBmb3IgZXh0ZXJuYWxpemVkIGRlcHNcbiAgICAgICAgZ2xvYmFsczoge1xuICAgICAgICAgIFwiQGF1dG9tZXJnZS9hdXRvbWVyZ2VcIjogXCJBdXRvbWVyZ2VcIixcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSxcbiAgfSxcbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUVBLFNBQVMsb0JBQW9CO0FBQzdCLE9BQU8sVUFBVTtBQUNqQixPQUFPLFVBQVU7QUFDakIsT0FBTyxTQUFTO0FBQ2hCLE9BQU8sbUJBQW1CO0FBTjFCLElBQU0sbUNBQW1DO0FBUXpDLElBQU0sY0FBYyxDQUFDLFFBQWdCLEtBQUssUUFBUSxrQ0FBVyxHQUFHO0FBRWhFLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVM7QUFBQSxJQUNQLGNBQWM7QUFBQSxJQUNkLEtBQUs7QUFBQSxJQUNMLElBQUk7QUFBQSxNQUNGLFdBQVcsWUFBWSxLQUFLO0FBQUEsTUFDNUIsV0FBVyxZQUFZLFlBQVk7QUFBQSxJQUNyQyxDQUFDO0FBQUEsRUFDSDtBQUFBLEVBQ0EsY0FBYztBQUFBLElBQ1osU0FBUyxDQUFDLDJCQUEyQjtBQUFBLEVBQ3ZDO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsTUFDTCxvQ0FBb0M7QUFBQSxRQUNsQztBQUFBLE1BQ0Y7QUFBQSxNQUNBLHdCQUF3QjtBQUFBLFFBQ3RCO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQUEsRUFDQSxPQUFPO0FBQUEsSUFDTCxRQUFRO0FBQUEsSUFDUixLQUFLO0FBQUEsTUFDSCxPQUFPLFlBQVksY0FBYztBQUFBLE1BQ2pDLE1BQU07QUFBQSxNQUNOLFVBQVUsQ0FBQyxXQUFXLG1CQUFtQjtBQUFBLElBQzNDO0FBQUEsSUFDQSxlQUFlO0FBQUEsTUFHYixVQUFVLENBQUMsc0JBQXNCO0FBQUEsTUFDakMsUUFBUTtBQUFBLFFBR04sU0FBUztBQUFBLFVBQ1Asd0JBQXdCO0FBQUEsUUFDMUI7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
