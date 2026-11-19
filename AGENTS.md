# Repository instructions

## Scope and structure

- Supply `@oardi/logger` directly from GitHub, pinned to a release tag or full
  commit hash. Do not configure a registry or publish to npm. Keep `private: true`.
- Keep the package focused on `Logger`, `LoggerType`, `LoggerPayload`, and
  `LoggerListener`. Preserve the extracted API and behavior unless asked to change it.
- Keep source in `src/`, tests in `tests/`, and build/package checks in `scripts/`.
- Keep runtime and peer dependencies empty. Development tools belong in
  `devDependencies`. Use `import type` for type-only imports and relative `.js`
  imports inside the library so the emitted code resolves in Node.js.
- Compile JavaScript and declarations into ignored `dist/`. The ESM entry must
  forward to the CommonJS implementation so both formats share logger state.
- Keep `prepare` building the package for GitHub installs. Do not add publish
  scripts or automated releases.

## Changes and validation

- Inspect the working tree before editing and preserve unrelated changes.
- Handle consumer installation and migration separately from this repository.
- Test through the public package name without path aliases. Keep TypeScript
  contracts strict and explain each `@ts-expect-error`.
- Run `npm ci` when setting up the checkout and `npm run validate` after changes.
  CI must run the same commands. Validation covers the build, ESM/CommonJS type
  contracts, logger behavior, packed-consumer installation, and formatting.
- Document API behavior, GitHub tag/commit installs, development, and releases in
  `readme.md`. Do not claim remote installation or CI passed without running them.

## Versions and Git

- Keep `package.json`, both root version fields in `package-lock.json`, and the
  dated release entry in `changelog.md` consistent.
- Tags use `v<version>` and point to the commit with the matching release files.
- Create commits or tags, push, or publish only on explicit user instruction.
