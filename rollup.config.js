import withSolid from 'rollup-preset-solid';

export default withSolid([
  {
    input: 'src/index.tsx',
    mappingName: 'lib',
    output: {
      file: './dist/lib/index.js',
      format: 'module',
    },
    solidOptions: {
      generate: 'ssr',
      hydratable: true,
    },
  },
  {
    input: 'src/index.tsx',
    mappingName: 'lib',
    solidOptions: {
      generate: 'ssr',
      hydratable: true,
    },
    targets: ['cjs'],
    output: {
      file: './dist/lib/index.cjs',
      format: 'cjs',
    },
  },
]);
