// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['.eslintrc.js', 'eslint.config.mjs'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      "prettier/prettier": ["error", { endOfLine: "auto" }],
    },
  },

  {
    files: [
      'src/**/*.dto.ts',
      'src/**/dto/**/*.ts',
      'src/common/decorators/**/*.ts',
      'src/common/guards/**/*.ts',
      'src/common/filters/**/*.ts',
      'src/common/logger/**/*.ts',
      'src/common/interceptors/**/*.ts',
      'src/common/tenant/**/*.ts',
      'src/common/audit/**/*.ts',
      'src/modules/health/**/*.ts',
      'src/modules/audit/**/*.ts',
      'src/modules/auth/**/*.ts',
      'src/modules/customers/**/*.ts',
      'src/modules/contacts/**/*.ts',
      'src/modules/deals/**/*.ts',
      'src/modules/tasks/**/*.ts',
      'src/modules/search/**/*.ts',
      'src/communications/**/*.ts',
      'src/templates/**/*.ts',
      'src/workflows/**/*.ts',
      'test/**/**/*.ts',
      'src/**/strategies/**/*.ts',
      'src/**/jwt.strategy.ts',
    ],
    rules: {
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
    },
  },
);
