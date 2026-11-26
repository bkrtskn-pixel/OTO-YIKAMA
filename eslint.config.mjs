// @ts-check
import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/coverage/**',
      '**/next-env.d.ts',
      'apps/api/prisma/migrations/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.node, ...globals.browser },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      // XSS koruması: ham HTML basmak yasak (bkz. docs/04 G-08)
      'no-restricted-syntax': [
        'error',
        {
          selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']",
          message: 'dangerouslySetInnerHTML kullanılamaz (XSS riski).',
        },
        {
          selector: "CallExpression[callee.property.name='$queryRawUnsafe']",
          message: '$queryRawUnsafe yasak; $queryRaw tagged template kullanın.',
        },
        {
          selector: "CallExpression[callee.property.name='$executeRawUnsafe']",
          message: '$executeRawUnsafe yasak; $executeRaw tagged template kullanın.',
        },
      ],
    },
  },
);
