module.exports = {
  root: true,
  extends: ['custom/next'],
  globals: {
    Messages: 'readonly',
  },
  ignorePatterns: ['public/sw.js', 'public/workbox-*.js'],
  rules: {
    // Toast/catch handlers across the app reject with plain strings and render
    // them directly; converting to Error objects would change runtime output.
    '@typescript-eslint/prefer-promise-reject-errors': 'off',
  },
};
