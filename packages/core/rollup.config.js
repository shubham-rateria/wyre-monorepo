import dts from "rollup-plugin-dts";
import typescript from "@rollup/plugin-typescript";
import terser from "@rollup/plugin-terser";
import strip from "@rollup/plugin-strip";

const bundle = (config) => ({
  ...config,
  input: "src/index.ts",
  external: (id) => !/^[./]/.test(id),
});

export default [
  bundle({
    plugins: [
      strip({
        include: ["**/*.(mjs|js|ts)"],
        functions: ["console.log"],
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
        sourcemap: true,
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
