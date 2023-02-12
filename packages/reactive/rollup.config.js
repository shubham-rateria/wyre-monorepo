import dts from "rollup-plugin-dts";
import typescript from "@rollup/plugin-typescript";
import terser from "@rollup/plugin-terser";
import copy from "rollup-plugin-copy";
import { nodeResolve } from "@rollup/plugin-node-resolve";

const bundle = (config) => ({
  ...config,
  input: "src/index.ts",
  external: (id) => !/^[./]/.test(id),
});

export default [
  bundle({
    plugins: [
      typescript({
        exclude: ["**/__tests__", "**/*.test.ts"],
      }),
      terser(),
    ],
    output: [
      {
        file: `dist/index.js`,
        format: "es",
        sourcemap: false,
      },
    ],
  }),
  bundle({
    plugins: [dts()],
    output: {
      file: `dist/index.d.ts`,
      format: "es",
      sourcemap: false,
    },
  }),
  {
    input: "src/queue/input-queue.js",
    output: {
      file: "dist/queue/input-queue.js",
      format: "es",
    },
    plugins: [nodeResolve()],
  },
];
