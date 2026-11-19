# @oardi/ts-logger

Small, dependency-free logging utility extracted from `@oardi/ts-utils`.
Supports console output, synchronous listeners, five log levels, and a global
enable switch. Installed directly from GitHub; not published to an npm registry.

## Installation

Pin the dependency to a release tag:

```sh
npm install @oardi/ts-logger@github:oardi/oardi-ts-logger#v0.1.0
```

The tag must exist before installation. This command describes the intended
`0.1.0` release; tags are created only on explicit request.

Alternatively, replace `<full-commit-hash>` with an existing 40-character commit SHA:

```sh
npm install "@oardi/ts-logger@github:oardi/oardi-ts-logger#<full-commit-hash>"
```

Commit the consumer's updated `package.json` and `package-lock.json`. Use a tag or
full commit hash rather than a branch. No registry configuration is needed.
Unlike `@oardi/ts-types`, this package includes runtime code and is installed as a
regular dependency. npm runs `prepare` to build JavaScript and declarations for
GitHub installations; allow install scripts for that build.

## Usage

```ts
import { Logger, LoggerType } from '@oardi/ts-logger';
import type { LoggerListener, LoggerPayload } from '@oardi/ts-logger';

Logger.info('Application started', { environment: 'development' });
Logger.warn('Low disk space', 1024);

const listener: LoggerListener = (payload: LoggerPayload) => {
	if (payload.type === LoggerType.debug) return false;
};
const unsubscribe = Logger.onLog(listener);

Logger.debug('Visible to listeners, suppressed in the console');
unsubscribe();
```

CommonJS is supported too:

```js
const { Logger } = require('@oardi/ts-logger');
Logger.info('Application started');
```

ESM and CommonJS entry points share the same logger instance when resolved from
the same installed package copy. The package requires no browser globals or
initialization and does not log merely by being imported.

## API

| API                                                         | Behavior                                                                  |
| ----------------------------------------------------------- | ------------------------------------------------------------------------- |
| `log/info/warn/debug/error(...args: unknown[]): void`       | Notify listeners, then call the matching console method.                  |
| `onLog(listener: LoggerListener, once = false): () => void` | Register a listener and return its unsubscribe function.                  |
| `clearListeners(): void`                                    | Remove all listeners.                                                     |
| `setEnabled(enabled: boolean): void`                        | Enable or suppress both listeners and console output; enabled by default. |

`LoggerType` is a string enum with `log`, `info`, `warn`, `debug`, and `error`.

```ts
type LoggerPayload = {
	type: LoggerType;
	args: unknown[];
	timestamp: string; // ISO timestamp generated for this log call
};

type LoggerListener = (payload: LoggerPayload) => void | boolean;
```

Listeners run synchronously in registration order and receive the same payload.
Returning `false` suppresses only the console call; later listeners still run.
Other return values do not suppress output. Listener exceptions are swallowed,
allowing later listeners and console output to continue. `once: true` removes
the listener after its first invocation, including if it throws. Unsubscribe
functions can be called repeatedly.

```ts
Logger.onLog(payload => {
	// Handle the first message only.
	console.info(payload);
}, true);

Logger.setEnabled(false);
Logger.info('Suppressed');
Logger.setEnabled(true);
Logger.clearListeners();
```

Listener registration and the enable switch are static, shared state within the
installed package instance. The previous `@oardi/ts-utils` implementation remains
a separate instance during migration; switch imports consistently when adopting
this package. Consumer installation and removal of the old implementation are
handled separately.

## Local development

With Node.js 24 and npm:

```sh
npm ci
npm run validate
```

`npm ci` also runs `prepare`. `npm run build` emits CommonJS JavaScript, an ESM
entry point, and declarations into `dist/`; generated files are not checked in.
`npm run validate` builds, checks public ESM/CommonJS TypeScript contracts, runs
the extracted logger tests, installs a local package archive in an isolated
consumer to verify runtime/type exports, and checks formatting. This archive
check does not contact GitHub. `npm run format` applies formatting.

GitHub Actions runs `npm ci` and `npm run validate` on pushes and pull requests.
All dependencies are development tools; the installed package has no runtime
or peer dependencies.

## Versions and releases

Keep `package.json`, both root version fields in `package-lock.json`, and the
dated `changelog.md` entry aligned. Tags follow `v<version>`; `v0.1.0` must point
to the commit containing the matching version and changelog.

Run `npm run validate` before a release. Create commits or tags and push only
when explicitly requested. There is no npm publication, registry setup, or
automated release workflow.

## License

[MIT](LICENSE)
