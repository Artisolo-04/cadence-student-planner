import globals from "globals";

const PROPS =
  "(?:p|px|py|pt|pr|pb|pl|ps|pe|m|mx|my|mt|mr|mb|ml|ms|me|gap|gap-x|gap-y|space-x|space-y)";
const VALUE = String.raw`(?:[1-9]\d*(?:\.\d+)?|0\.5|\[[^\]]+\])`;
const RAW = String.raw`(?:^|[\s:!])-?${PROPS}-${VALUE}(?=$|\s)`;

const MESSAGE =
  "Raw spacing utility. Use a named token utility from theme.css instead.";

export default [
  { ignores: ["dist/**", "node_modules/**"] },
  {
    files: ["src/**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      "no-restricted-syntax": [
        "warn",
        { selector: `Literal[value=/${RAW}/]`, message: MESSAGE },
        { selector: `TemplateElement[value.raw=/${RAW}/]`, message: MESSAGE },
        {
          selector:
            "JSXAttribute[name.name='style'] Property[key.name=/^(margin|padding|gap)/]",
          message: "Inline spacing style. Use a token utility instead.",
        },
      ],
    },
  },
];
