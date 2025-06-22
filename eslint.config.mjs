import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import tseslint from 'typescript-eslint';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

// 🚀 分離設定：JS 和 TS 分開處理
const eslintConfig = tseslint.config(
  // 基礎設定，適用於所有檔案
  ...compat.extends("next/core-web-vitals"),

  // 僅針對 TypeScript 檔案的嚴格類型檢查設定
  {
    files: ['**/*.ts', '**/*.tsx'],
    extends: [
      ...tseslint.configs.recommended,
      ...tseslint.configs.strictTypeChecked,
    ],
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // ⚠️ 針對 'any' 類型的客製化規則
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      // 你可以根據需要調整更多規則
    },
  },

  // 全域忽略
  {
    ignores: [
      '.vercel/**',
      '.next/**',
      'next-env.d.ts',
      '*.mjs',
      'src/components/ui/**',
    ],
  }
);

export default eslintConfig;
