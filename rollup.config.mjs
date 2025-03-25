import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import peerDepsExternal from "rollup-plugin-peer-deps-external";
import dts from "rollup-plugin-dts";
import packageJson from "./package.json" with { type: "json" };
import json from '@rollup/plugin-json';
import babel from '@rollup/plugin-babel';

export default [
  {
    input: "src/index.ts",
    external: [
      'react',
      'react-dom',
      'react/jsx-runtime',
      'axios'
    ],
    output: [
      {
        file: packageJson.main,
        format: "cjs",
        sourcemap: true,
      },
      {
        file: packageJson.module,
        format: "esm",
        sourcemap: true,
      },
    ],
    plugins: [
      peerDepsExternal(), 
      resolve(), 
      commonjs(), 
      json(), 
      typescript({ tsconfig: "./tsconfig.json" }),
      babel({
        babelHelpers: 'bundled',
        exclude: 'node_modules/**',
        presets: [['@babel/preset-react', { "runtime": "automatic" }]],
        extensions: ['.js', '.jsx']
      })
    ],
  },
  {
    input: packageJson.types,
    output: {
      file: "dist/index.d.ts",
      format: "es",
    },
    plugins: [dts()],
  },
];
