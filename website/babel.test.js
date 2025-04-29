// This configuration is only used for Jest testing
// Next.js will use its own built-in configuration for normal operations
module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    ['@babel/preset-react', { runtime: 'automatic' }],
    '@babel/preset-typescript',
  ],
  // This is needed for testing
  env: {
    test: {
      plugins: [
        'babel-plugin-transform-import-meta',
      ],
    },
  },
};
