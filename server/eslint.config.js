// eslint.config.js
import eslint from "eslint";
import prettierPlugin from "eslint-plugin-prettier";
import prettierConfig from "eslint-config-prettier";

// Extend the Prettier configuration to include `endOfLine`
const customPrettierConfig = {
  ...prettierConfig,
  endOfLine: "lf",
};

export default [
  {
    ignores: ["node_modules/**", "dist/**"], // Ignore common directories
  },
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        // Define global variables for Node and ES6
        require: "readonly",
        process: "readonly",
        module: "readonly",
        __dirname: "readonly",
        exports: "readonly",
        Buffer: "readonly",
        console: "readonly", // Ensure console is defined as a global
      },
    },
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      "prettier/prettier": ["error", { endOfLine: "lf" }], // Enforce LF line endings with Prettier
      "no-unused-vars": "warn", // Warn on unused variables
      "no-undef": "error", // Error on undefined variables
      "consistent-return": "error", // Enforce consistent returns
      "no-console": "off", // Allow console logs
      "prefer-const": "error", // Use const where possible
      "no-restricted-syntax": [
        "error",
        {
          selector: "ForInStatement",
          message: "for...in statements are not allowed.",
        },
      ],
    },
    settings: {
      prettierConfig: customPrettierConfig,
    },
  },
];
