# @oardi/logger

Small, dependency-free logger with five log levels, synchronous listeners, and a
global enable switch. Supports ESM, CommonJS, and TypeScript.

## Installation

Install directly from GitHub, pinned to a release tag:

```sh
npm install @oardi/logger@github:oardi/oardi-logger#v0.3.0
```

The release tag must exist on GitHub before installation.

Or replace `<full-commit-hash>` with an existing 40-character commit SHA:

```sh
npm install "@oardi/logger@github:oardi/oardi-logger#<full-commit-hash>"
```

Allow install scripts: `prepare` builds the package during GitHub installation.
Commit the consumer's `package.json` and lockfile. No npm registry setup is needed.

## Usage

```ts
import { Logger, LoggerType } from '@oardi/logger';

Logger.info('Application started', { environment: 'development' });
Logger.error(new Error('Something went wrong'));

const unsubscribe = Logger.onLog(payload => {
	if (payload.type === LoggerType.debug) return false;
});

Logger.debug('Sent to listeners, hidden from the console');
unsubscribe();
```

CommonJS: `const { Logger, LoggerType } = require('@oardi/logger');`.
Both formats share the same state within one installed package copy.

## API

All methods are static on `Logger`.

| Method                                                      | Behavior                                                                      |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `log/info/warn/debug/error(...args: unknown[]): void`       | Notify listeners, then call the matching console method.                      |
| `onLog(listener: LoggerListener, once = false): () => void` | Register a listener; return an unsubscribe function, safe to call repeatedly. |
| `clearListeners(): void`                                    | Remove all listeners.                                                         |
| `setEnabled(enabled: boolean): void`                        | Enable or suppress listeners and console output. Enabled by default.          |

`LoggerType` contains `log`, `info`, `warn`, `debug`, and `error`.
The package also exports these types:

```ts
type LoggerPayload = {
	type: LoggerType;
	args: unknown[];
	timestamp: string; // ISO timestamp of the log call
};

type LoggerListener = (payload: LoggerPayload) => void | boolean;
```

Listeners run synchronously in registration order and receive the same payload.
Returning `false` suppresses only console output; later listeners still run.
Listener exceptions are swallowed. With `once = true`, the listener is removed
before its callback, so it runs at most once even if it throws or logs again.
Listeners added during a log call receive that message too; removing or clearing
listeners before their turn skips them.

## Development and releases

Use Node.js 24 and npm:

```sh
npm ci
npm run validate
```

Validation builds into ignored `dist/`, checks ESM/CommonJS types and behavior,
installs a local package archive in an isolated consumer, and checks formatting.
CI runs the same commands. `npm run format` applies formatting.

For a release, align `package.json`, both root version fields in
`package-lock.json`, and the dated entry in `changelog.md`. After validation,
create a `v<version>` tag on the matching commit. Commits, tags, and pushes require
an explicit request. The package stays private and is distributed through GitHub;
there is no npm publication or automated release.

## License

[MIT](LICENSE)
