import { afterEach, describe, expect, it, vi } from 'vitest';
import { Logger, LoggerType } from '@oardi/ts-logger';

afterEach(() => {
	Logger.clearListeners();
	Logger.setEnabled(true);
	vi.restoreAllMocks();
});

describe('Logger', () => {
	it.each([
		['log', LoggerType.log],
		['info', LoggerType.info],
		['warn', LoggerType.warn],
		['debug', LoggerType.debug],
		['error', LoggerType.error],
	] as const)('forwards %s messages to listeners and console', (method, type) => {
		const consoleSpy = vi.spyOn(console, method).mockImplementation(() => {});
		const listener = vi.fn();
		Logger.onLog(listener);

		Logger[method]('message', 42);

		expect(listener).toHaveBeenCalledOnce();
		expect(listener).toHaveBeenCalledWith({
			type,
			args: ['message', 42],
			timestamp: expect.any(String),
		});
		expect(consoleSpy).toHaveBeenCalledWith('message', 42);
	});

	it('returns an unsubscribe function', () => {
		const listener = vi.fn();
		const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
		const unsubscribe = Logger.onLog(listener);

		unsubscribe();
		Logger.info('message');

		expect(listener).not.toHaveBeenCalled();
		expect(consoleSpy).toHaveBeenCalledOnce();
	});

	it('removes a once-listener after its first message', () => {
		const listener = vi.fn();
		vi.spyOn(console, 'info').mockImplementation(() => {});
		Logger.onLog(listener, true);

		Logger.info('first');
		Logger.info('second');

		expect(listener).toHaveBeenCalledOnce();
	});

	it('lets a listener veto the console call', () => {
		const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
		Logger.onLog(payload => (payload.type === LoggerType.debug ? false : undefined));

		Logger.debug('secret');

		expect(consoleSpy).not.toHaveBeenCalled();
	});

	it('notifies later listeners when an earlier listener vetoes the console call', () => {
		const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
		const vetoingListener = vi.fn(() => false);
		const laterListener = vi.fn();
		Logger.onLog(vetoingListener);
		Logger.onLog(laterListener);

		Logger.debug('secret');

		expect(vetoingListener).toHaveBeenCalledOnce();
		expect(laterListener).toHaveBeenCalledOnce();
		expect(laterListener).toHaveBeenCalledWith(vetoingListener.mock.calls[0][0]);
		expect(consoleSpy).not.toHaveBeenCalled();
	});

	it('suppresses listeners and console while disabled', () => {
		const listener = vi.fn();
		const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		Logger.onLog(listener);
		Logger.setEnabled(false);

		Logger.warn('hidden');

		expect(listener).not.toHaveBeenCalled();
		expect(consoleSpy).not.toHaveBeenCalled();
	});

	it('continues logging when a listener throws', () => {
		const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		Logger.onLog(() => {
			throw new Error('listener failed');
		});

		expect(() => Logger.error('visible')).not.toThrow();
		expect(consoleSpy).toHaveBeenCalledWith('visible');
	});
});
