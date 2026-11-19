# Changelog

## 0.3.0 - 2026-11-19

- Remove once-listeners before their callback so recursive logging invokes them
  only once.
- Cover listener errors, repeated unsubscribe, clearing, re-enabling, and changes
  during logging with regression tests.

## 0.2.0 - 2026-11-19

- Name the package `@oardi/logger` and the repository `oardi-logger`.

## 0.1.0 - 2026-11-19

- Extract `Logger`, `LoggerType`, `LoggerPayload`, and `LoggerListener` from
  `@oardi/ts-utils` without changing logging behavior.
- Provide ESM, CommonJS, and TypeScript entry points without runtime dependencies.
- Support GitHub installations pinned to a tag or commit, with an automatic build.
- Add behavior tests, compiler contracts, packed-consumer checks, formatting, and CI.
