module.exports = {
  env: {
    es2021: true,
    node: true,
  },
  extends: ["eslint:recommended", "plugin:prettier/recommended"],
  overrides: [
    // 定制化某个文件夹的规则
    // {
    //     "files": ["lib/**/*.js"],
    //     "rules": {
    //     }
    // }
  ],

  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },

  rules: {
    "no-undef": "error",
    // 允许使用tab缩进
    "no-tabs": "off",
    // 允许控制台输出
    "no-console": "off",
    "no-constant-condition": "off",
    "no-unused-vars": ["error", { vars: "all", args: "none", ignoreRestSiblings: true }],
  },
};
