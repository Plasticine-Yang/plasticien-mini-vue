import typescript from '@rollup/plugin-typescript';
import pkg from './package.json';

/**
 * @type { import('rollup').RollupOptions }
 */
const config = {
  input: './src/index.ts',
  output: [
    {
      format: 'cjs',
      file: pkg.main,
    },
    {
      format: 'es',
      file: pkg.module,
    },
  ],
  plugins: [typescript()],
};

export default config;
