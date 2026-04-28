/** @type {import('eslint').Linter.Config[]} */
module.exports = [
  ...require('./base'),
  {
    rules: {
      'react/display-name': 'error',
      'react/prop-types': 'off',
    },
  },
]
