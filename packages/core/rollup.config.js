import dts from "rollup-plugin-dts";
import typescript from "@rollup/plugin-typescript";
import terser from "@rollup/plugin-terser";
import strip from "@rollup/plugin-strip";

const bundle = (config) => ({
  ...config,
  input: "src/index.ts",
  external: (id) => !/^[./]/.test(id),
});

//activ-aa5f055e6a02b702bc4e4f92db5eae85v3

// npm config set '//api.keygen.sh/v1/accounts/9fb6c504-8f2b-4497-9025-424775ea665d/artifacts/:_authToken' 'activ-aa5f055e6a02b702bc4e4f92db5eae85v3'

export default [
  bundle({
    plugins: [
      strip({
        include: ["**/*.(mjs|js|ts)"],
        functions: ["console.log", "console.debug"],
        debugger: false,
      }),
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
      sourcemap: true,
    },
  }),
];
