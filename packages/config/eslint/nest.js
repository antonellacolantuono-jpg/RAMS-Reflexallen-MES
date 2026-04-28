/** @type {import('eslint').Linter.Config[]} */
module.exports = [
  ...require('./base'),
  {
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
    },
  },
]
