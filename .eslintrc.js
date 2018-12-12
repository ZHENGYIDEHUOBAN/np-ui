module.exports = {
  root: true,
  env: {
    node: true
  },
  'extends': [
    'plugin:vue/essential',
    '@vue/standard'
  ],
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
     // 分号结尾
     "semi": [2, "always"],  
     // 函数括号前无空格
     "space-before-function-paren": [0, "always"],
     // 短路求值
     'no-unused-expressions': 0,
     'object-property-newline': 0,
     'no-eval': 0,
     'no-dupe-keys': 0,
     'no-useless-call': 0
  },
  parserOptions: {
    parser: 'babel-eslint'
  }
}
