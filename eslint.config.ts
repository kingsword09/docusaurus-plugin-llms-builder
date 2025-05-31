import jseslint from "@eslint/js";
import type { Linter } from "eslint";
import globals from "globals";
import tseslint from "typescript-eslint";

const config: Linter.Config[] = [
  {
    ignores: ["dist", "node_modules", "website"],
  },
  ...(tseslint.configs.recommended as Linter.Config[]),
  {
    ...jseslint.configs.recommended,
    files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
    ignores: ["dist", "node_modules"],
    languageOptions: {
      globals: globals.node,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      eqeqeq: ["error", "smart"],
      // 未使用的变量发出警告，但忽略以_开头的参数
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "prefer-const": "error",
      "no-duplicate-imports": "error",

      "@typescript-eslint/no-explicit-any": "warn",
      // 导出函数和类的公共类方法应该有显式的返回和参数类型
      "@typescript-eslint/explicit-module-boundary-types": "warn",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      // 确保类型导出一致
      "@typescript-eslint/consistent-type-exports": "error",
      // 确保类型导入一致
      "@typescript-eslint/consistent-type-imports": ["error", { fixStyle: "inline-type-imports" }],
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
    },
  },
];

export default config;
