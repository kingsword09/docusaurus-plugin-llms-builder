import jseslint from "@eslint/js";
import type { Linter } from "eslint";
import globals from "globals";
import tseslint from "typescript-eslint";

const config: Linter.Config[] = [
  ...(tseslint.configs.recommended as Linter.Config[]),
  {
    ...jseslint.configs.recommended,
    files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
    languageOptions: { globals: globals.node },
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "object-curly-spacing": ["error", "always"],
      "array-bracket-spacing": ["error", "never"],
      eqeqeq: ["error", "smart"],
      "no-multi-spaces": "error",
      // 导出函数和类的公共类方法应该有显式的返回和参数类型
      "@typescript-eslint/explicit-module-boundary-types": "warn",
      // 未使用的变量发出警告，但忽略以_开头的参数
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "prefer-const": "error",
      "no-duplicate-imports": "error",

      // 确保类型导出一致
      "@typescript-eslint/consistent-type-exports": "error",
      // 确保类型导入一致
      "@typescript-eslint/consistent-type-imports": "error",
      // 防止类型导入产生副作用
      "@typescript-eslint/no-import-type-side-effects": "error",
      // 统一方法签名风格
      "@typescript-eslint/method-signature-style": "error",
      // 命名约定
      "@typescript-eslint/naming-convention": [
        "error",
        {
          selector: "interface",
          format: ["PascalCase"],
          prefix: ["I"],
        },
        {
          selector: "typeAlias",
          format: ["PascalCase"],
        },
      ],
      // 对于库，通常推荐命名导出而非默认导出
      "import/no-default-export": "warn",
    },
  },
];

export default config;
