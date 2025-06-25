# Check Runner Documentation

## Overview

This interactive CLI utility allows you to selectively run common development scripts—like linting, formatting, type-checking, and testing—defined in your `package.json`. It's built with Node.js and TypeScript, but runs **without requiring a build step**, thanks to the use of `--experimental-strip-types`.

The script is executed via:

```bash
npm run checks
```

## Setup in `package.json`

Make sure your `package.json` includes the following:

```json
"scripts": {
  "checks": "node --experimental-strip-types ./scripts/checks-runner.ts"
}
```

### What This Does

- **`checks`** is your custom script.
- **`--experimental-strip-types`** tells Node.js to **run TypeScript files directly** by stripping types at runtime (available in Node.js 20+).
- **`./scripts/checks-runner.ts`** points to the actual script runner file.

> ⚠️ **Node.js 20+ is required** for `--experimental-strip-types`.

## Features

- **Interactive selection** of scripts to run using checkboxes
- **Validation** of required scripts against `package.json`
- **Sequential execution** of scripts via `npm run`
- **Emoji-enhanced** UI with real-time status updates via spinners
- **Detailed output & error reporting** for failed scripts
- **Graceful shutdown** on `Ctrl+C` or termination signals

## Supported Scripts

Your `package.json` must include the following scripts:

| Script         | Tool       | Description                         | Emoji |
| -------------- | ---------- | ----------------------------------- | ----- |
| `format:check` | Prettier   | Opinionated code formatter          | ✨    |
| `lint`         | ESLint     | Static code analysis for problems   | 🔍    |
| `typecheck`    | TypeScript | Run type checker using the compiler | 📝    |
| `build`        | Build      | Compile and bundle the application  | 📦    |
| `test:unit`    | Vitest     | Run unit tests                      | 🧪    |
| `test:e2e`     | Playwright | Run end-to-end tests                | 🎭    |

If any are missing, the script will throw an error and exit.

## How It Works

1. **Welcome Screen**
   - Displays a greeting and prompts the user to select scripts to run.

2. **Validation**
   - Ensures all expected scripts exist in `package.json`.

3. **Selection**
   - Uses a checkbox prompt to let the user pick which scripts to run.

4. **Execution**
   - Each selected script is executed using `npm run <script> [args]`.
   - Real-time spinner updates show progress.
   - Output is streamed and printed live in the console.

5. **Completion**
   - On success: shows success messages.
   - On failure: prints full output and exits with error.

6. **Graceful Exit**
   - Cleans up running processes if interrupted.

## Running the Script

Simply run:

```bash
npm run checks
```

### Example Output

```shell
🚀 Welcome to the Script Runner!

📋 Select scripts to run. They will be executed in the order selected.

❯ ◯ ✨ Prettier - Opinionated code formatter
  ◯ 🔍 ESLint - Statically analyzes your code to find problems
  ◯ 📝 Typescript - Run compiler by checking your code
  ◯ 📦 Build - Build application and server
  ◯ 🧪 Vitest - Run next generation unit testing framework
  ◯ 🎭 Playwright - Run reliable end-to-end testing for modern web apps
```
