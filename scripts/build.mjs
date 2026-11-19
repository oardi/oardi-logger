import { execFileSync } from 'node:child_process';
import { rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const require = createRequire(import.meta.url);
const output = new URL('../dist/', import.meta.url);

rmSync(output, { recursive: true, force: true });
execFileSync(
	process.execPath,
	[
		join(dirname(require.resolve('typescript/package.json')), 'bin', 'tsc'),
		'--project',
		'tsconfig.json',
	],
	{
		cwd: root,
		stdio: 'inherit',
	}
);

// Both module formats use the same class and therefore the same listener state.
writeFileSync(new URL('index.mjs', output), "export { Logger, LoggerType } from './index.js';\n");
