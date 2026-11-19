import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const require = createRequire(import.meta.url);
const temporary = mkdtempSync(join(tmpdir(), 'oardi-logger-package-'));
const npm = (args, cwd) =>
	execFileSync('npm', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] });

try {
	const [archive] = JSON.parse(
		npm(['pack', '--ignore-scripts', '--json', '--pack-destination', temporary], root)
	);
	assert(archive.files.some(file => file.path === 'dist/index.mjs'));
	assert(archive.files.some(file => file.path === 'dist/index.js'));
	assert(archive.files.some(file => file.path === 'dist/index.d.ts'));
	assert(
		archive.files.every(
			file =>
				file.path.startsWith('dist/') ||
				['LICENSE', 'package.json', 'readme.md'].includes(file.path)
		)
	);

	writeFileSync(
		join(temporary, 'package.json'),
		JSON.stringify({ private: true, type: 'module' })
	);
	npm(
		[
			'install',
			'--offline',
			'--ignore-scripts',
			'--no-audit',
			'--no-fund',
			'--package-lock=false',
			join(temporary, archive.filename),
		],
		temporary
	);

	const manifest = JSON.parse(
		readFileSync(join(temporary, 'node_modules/@oardi/logger/package.json'), 'utf8')
	);
	assert.equal(manifest.private, true);
	assert.equal(Object.keys(manifest.dependencies ?? {}).length, 0);
	assert.equal(Object.keys(manifest.peerDependencies ?? {}).length, 0);

	writeFileSync(
		join(temporary, 'runtime.mjs'),
		`
        import assert from 'node:assert/strict';
        import { createRequire } from 'node:module';
        import * as esm from '@oardi/logger';
        const require = createRequire(import.meta.url);
        const cjs = require('@oardi/logger');
        assert.deepEqual(Object.keys(esm).sort(), ['Logger', 'LoggerType']);
        assert.deepEqual(Object.keys(cjs).sort(), ['Logger', 'LoggerType']);
        assert.equal(esm.Logger, cjs.Logger);
        assert.equal(esm.LoggerType, cjs.LoggerType);
        let received;
        const unsubscribe = esm.Logger.onLog(payload => { received = payload; return false; });
        esm.Logger.setLevels([esm.LoggerType.error]);
        cjs.Logger.info('filtered');
        assert.equal(received, undefined);
        cjs.Logger.setLevels([cjs.LoggerType.info]);
        esm.Logger.info('packed consumer', 42);
        assert.equal(received.type, esm.LoggerType.info);
        assert.deepEqual(received.args, ['packed consumer', 42]);
        assert.equal(new Date(received.timestamp).toISOString(), received.timestamp);
        unsubscribe();
    `
	);
	execFileSync(process.execPath, ['runtime.mjs'], { cwd: temporary, stdio: 'inherit' });

	for (const name of ['types.mts', 'types.cts']) {
		copyFileSync(join(root, 'tests', name), join(temporary, name));
	}
	const config = JSON.parse(readFileSync(join(root, 'tsconfig.test.json'), 'utf8'));
	config.include = ['types.mts', 'types.cts'];
	writeFileSync(join(temporary, 'tsconfig.json'), JSON.stringify(config));
	execFileSync(
		process.execPath,
		[
			join(dirname(require.resolve('typescript/package.json')), 'bin', 'tsc'),
			'--project',
			join(temporary, 'tsconfig.json'),
		],
		{ cwd: temporary, stdio: 'inherit' }
	);
	console.log('Packed ESM, CommonJS, shared listener state, and TypeScript contracts passed.');
} finally {
	rmSync(temporary, { recursive: true, force: true });
}
