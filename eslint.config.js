import js from "@eslint/js";
import stylistic from "@stylistic/eslint-plugin";
import { defineConfig, globalIgnores } from "eslint/config";
import sonarjs from "eslint-plugin-sonarjs";
import unicorn from "eslint-plugin-unicorn";
import globals from "globals";
import tseslint from "typescript-eslint";

// Flux Field's shared conventions (6c9c070b). Keep the broad presets below so plugin
// updates add new recommendations automatically; disable unwanted rules here.
const sharedRules = {
    "curly": "off",
    "@stylistic/indent": [
        "warn",
        4,
        {
            "SwitchCase": 1
        }
    ],
    "@stylistic/max-len": [
        "warn",
        120
    ],
    "max-params": "off",
    "@stylistic/quotes": [
        "warn",
        "double"
    ],
    "no-ternary": "off",
    "max-statements": "off",
    "@stylistic/comma-dangle": [
        "warn",
        "only-multiline"
    ],
    "new-cap": "off",
    "sort-keys": "off",
    "sort-imports": "off",
    "one-var": [
        "warn",
        "never"
    ],
    "id-length": "off",
    "no-dupe-class-members": "off",
    "camelcase": "off",
    "prefer-template": "off",
    "prefer-destructuring": "off",
    "no-else-return": "off",
    "no-undefined": "off",
    "no-void": "off",
    "max-lines": "off",
    "no-plusplus": "off",
    "unicorn/switch-case-braces": "off",
    "unicorn/prefer-switch": "off",
    "unicorn/prefer-ternary": "off",
    "unicorn/no-keyword-prefix": "off",
    "unicorn/name-replacements": "off",
    "unicorn/no-negated-condition": "off",
    "unicorn/empty-brace-spaces": "off",
    "unicorn/catch-error-name": "off",
    "no-implicit-globals": "off",
    "no-constant-condition": "off",
    "unicorn/explicit-length-check": [
        "warn",
        {
            "non-zero": "not-equal"
        }
    ],
    "max-lines-per-function": "off",
    "func-style": "off",
    "arrow-body-style": "off",
    "no-inline-comments": "off",
    "capitalized-comments": "off",
    "no-warning-comments": "off",
    "@stylistic/no-multiple-empty-lines": [
        "warn",
        {
            "max": 2,
            "maxBOF": 0,
            "maxEOF": 0
        }
    ],
    "@stylistic/object-curly-spacing": [
        "warn",
        "always"
    ],
    "no-continue": "off",
    "max-classes-per-file": "off",
    "no-console": "off",
    "no-magic-numbers": "off",
    "init-declarations": "off",
    "no-empty-function": "off",
    "vars-on-top": "off",
    "func-names": "off",
    "no-implicit-coercion": "off",
    "class-methods-use-this": "off",
    "no-negated-condition": "off",
    "unicorn/number-literal-case": "off",
    "unicorn/numeric-separators-style": [
        "warn",
        {
            "number": {
                "minimumDigits": 4,
                "groupLength": 3
            }
        }
    ],
    "no-loop-func": "off",
    "unicorn/no-array-callback-reference": "off",
    "unicorn/no-null": "off",
    "unicorn/consistent-destructuring": "off",
    "unicorn/prefer-dom-node-remove": "off",
    "unicorn/no-useless-undefined": "off",
    "unicorn/filename-case": "off",
    "sonarjs/redundant-type-aliases": "off",
    "sonarjs/no-unused-vars": "off",
    "sonarjs/void-use": "off",
    "unicorn/prefer-global-this": "off",
    "no-duplicate-imports": "off",
    "no-useless-constructor": "off",
    "no-use-before-define": "off",
    "no-eq-null": "off",
    "no-var": "off",
    "no-shadow": "off",
    "no-unused-vars": "off",
    "sonarjs/function-return-type": "off",
    "sonarjs/no-async-constructor": "off",
    "sonarjs/cognitive-complexity": "off",
    "complexity": "off",
    "sonarjs/no-nested-conditional": "off",
    "no-underscore-dangle": "off",
    "no-await-in-loop": "off",
    "sonarjs/pseudo-random": "off",
    "unicorn/consistent-function-scoping": "off",
    "unicorn/single-line-block-comment-style": "off",
    "unicorn/try-complexity": "off",
    "unicorn/consistent-boolean-name": "off",
    "unicorn/prefer-short-arrow-method": "off",
    "@typescript-eslint/no-redeclare": "off",
    "unicorn/consistent-class-member-order": "off",
    "unicorn/require-post-message-target-origin": "off",
    "unicorn/prefer-includes-over-repeated-comparisons": "off",
};

const typescriptRules = {
    "@typescript-eslint/array-type": "off",
    "@typescript-eslint/consistent-type-definitions": "off",
    "@typescript-eslint/parameter-properties": "off",
    "@typescript-eslint/prefer-readonly-parameter-types": "off",
    "@typescript-eslint/explicit-member-accessibility": "off",
    "@typescript-eslint/init-declarations": "off",
    "@typescript-eslint/member-ordering": "off",
    "@typescript-eslint/naming-convention": [
        "warn",
        {
            "selector": "enumMember",
            "format": [
                "camelCase",
                "PascalCase"
            ]
        }
    ],
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/prefer-destructuring": "off",
    "@typescript-eslint/return-await": [
        "warn",
        "always"
    ],
    "@typescript-eslint/no-magic-numbers": "off",
    "@typescript-eslint/no-empty-function": "off",
    "@typescript-eslint/no-non-null-assertion": "off",
    "@typescript-eslint/explicit-function-return-type": [
        "warn",
        {
            "allowExpressions": true,
            "allowTypedFunctionExpressions": true,
            "allowHigherOrderFunctions": false,
            "allowIIFEs": true
        }
    ],
    "@typescript-eslint/no-extraneous-class": "off",
    "@typescript-eslint/no-unused-vars": [
        "warn",
        {
            "vars": "all",
            "args": "after-used",
            "caughtErrors": "all",
            "varsIgnorePattern": "^_",
            "argsIgnorePattern": "^_",
            "caughtErrorsIgnorePattern": "^_",
            "destructuredArrayIgnorePattern": "^_",
            "ignoreRestSiblings": false
        }
    ],
    "@typescript-eslint/no-dynamic-delete": "off",
    "@typescript-eslint/no-confusing-void-expression": "off",
    "@typescript-eslint/consistent-return": "off",
    "@typescript-eslint/class-methods-use-this": "off",
    "@typescript-eslint/no-use-before-define": "off",
    "@typescript-eslint/max-params": "off",
    "@typescript-eslint/no-unsafe-type-assertion": "off",
    "@typescript-eslint/ban-ts-comment": "off",
    "@typescript-eslint/no-unnecessary-condition": [
        "warn",
        {
            "allowConstantLoopConditions": "always"
        }
    ]
};

const config = defineConfig(
    globalIgnores([".build/**", ".runtime/**", ".playwright-cli/**"]),
    {
        files: ["eslint.config.js", "scripts/**/*.mjs"],
        extends: [js.configs.all, sonarjs.configs.recommended, unicorn.configs.all],
        plugins: { "@stylistic": stylistic },
        languageOptions: { globals: globals.node },
        rules: sharedRules,
    },
    {
        files: ["**/*.ts"],
        extends: [js.configs.all, tseslint.configs.all, sonarjs.configs.recommended, unicorn.configs.all],
        plugins: { "@stylistic": stylistic },
        languageOptions: {
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
        rules: { ...sharedRules, ...typescriptRules },
    },
);

// All enabled rules are advisory, including rules introduced by preset updates.
// Normalize severities directly instead of patching ESLint with only-warn.
export default config.map(entry => ({
    ...entry,
    ...(entry.rules ? {
        rules: Object.fromEntries(Object.entries(entry.rules).map(([name, setting]) => {
            const [severity, ...options] = Array.isArray(setting) ? setting : [setting];
            return [name, [severity === "off" || severity === 0 ? "off" : "warn", ...options]];
        })),
    } : {}),
}));
