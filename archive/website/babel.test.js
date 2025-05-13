// Babel configuration for Jest tests
module.exports = {
  presets: [
    ['@babel/preset-env', { 
      targets: { node: 'current' },
      modules: 'commonjs' // Force CommonJS modules for Jest compatibility
    }],
    ['@babel/preset-react', { 
      runtime: 'automatic' 
    }],
    ['@babel/preset-typescript', { 
      isTSX: true, 
      allExtensions: true 
    }],
  ],
  plugins: [
    'babel-plugin-transform-import-meta',
    '@babel/plugin-syntax-jsx',
    '@babel/plugin-transform-runtime',
    '@babel/plugin-transform-modules-commonjs',
  ],
};
