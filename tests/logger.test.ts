import { afterEach, describe, expect, it, vi } from 'vitest';
import { Logger, LoggerType } from '@oardi/logger';

afterEach(() => {
	Logger.clearListeners();
	Logger.setEnabled(true);
	Logger.setLevels(Object.values(LoggerType));
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

	it.each(Object.values(LoggerType))('enables only the selected level %s', level => {
		const consoleSpies = Object.values(LoggerType).map(type => ({
			type,
			spy: vi.spyOn(console, type).mockImplementation(() => {}),
		}));
		const listener = vi.fn();
		Logger.onLog(listener);
		Logger.setLevels([level]);

		for (const type of Object.values(LoggerType)) Logger[type]('message', type);

		expect(listener).toHaveBeenCalledExactlyOnceWith(
			expect.objectContaining({ type: level, args: ['message', level] })
		);
		for (const { type, spy } of consoleSpies) {
			if (type === level) expect(spy).toHaveBeenCalledExactlyOnceWith('message', level);
			else expect(spy).not.toHaveBeenCalled();
		}
	});

	it('suppresses every level with an empty selection and can restore all levels', () => {
		const consoleSpies = Object.values(LoggerType).map(type =>
			vi.spyOn(console, type).mockImplementation(() => {})
		);
		const listener = vi.fn();
		Logger.onLog(listener);
		Logger.setLevels([]);

		for (const type of Object.values(LoggerType)) Logger[type]('hidden');

		expect(listener).not.toHaveBeenCalled();
		for (const spy of consoleSpies) expect(spy).not.toHaveBeenCalled();

		Logger.setLevels(Object.values(LoggerType));
		for (const type of Object.values(LoggerType)) Logger[type]('visible');

		expect(listener).toHaveBeenCalledTimes(5);
		for (const spy of consoleSpies) expect(spy).toHaveBeenCalledExactlyOnceWith('visible');
	});

	it('replaces the selection instead of adding levels', () => {
		const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
		const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		const listener = vi.fn();
		Logger.onLog(listener);
		Logger.setLevels([LoggerType.info]);
		Logger.setLevels([LoggerType.error]);

		Logger.info('hidden');
		Logger.error('visible');

		expect(listener).toHaveBeenCalledExactlyOnceWith(
			expect.objectContaining({ type: LoggerType.error, args: ['visible'] })
		);
		expect(infoSpy).not.toHaveBeenCalled();
		expect(errorSpy).toHaveBeenCalledExactlyOnceWith('visible');
	});

	it('copies the selection so later array changes do not affect logging', () => {
		const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
		const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		const levels = [LoggerType.info];
		Logger.setLevels(levels);
		levels[0] = LoggerType.error;

		Logger.info('visible');
		Logger.error('hidden');

		expect(infoSpy).toHaveBeenCalledExactlyOnceWith('visible');
		expect(errorSpy).not.toHaveBeenCalled();
	});

	it('preserves the level selection across the global enable switch', () => {
		const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
		const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
		const listener = vi.fn();
		Logger.onLog(listener);
		Logger.setLevels([LoggerType.info]);
		Logger.setEnabled(false);

		Logger.info('disabled');
		expect(listener).not.toHaveBeenCalled();
		expect(infoSpy).not.toHaveBeenCalled();

		Logger.setEnabled(true);
		Logger.debug('filtered');
		Logger.info('visible');

		expect(listener).toHaveBeenCalledExactlyOnceWith(
			expect.objectContaining({ type: LoggerType.info, args: ['visible'] })
		);
		expect(infoSpy).toHaveBeenCalledExactlyOnceWith('visible');
		expect(debugSpy).not.toHaveBeenCalled();
	});

	it('preserves once-listeners until an enabled level is logged', () => {
		const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
		const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
		const listener = vi.fn();
		Logger.onLog(listener, true);
		Logger.setLevels([LoggerType.info]);

		Logger.debug('filtered');
		expect(listener).not.toHaveBeenCalled();
		Logger.info('first');
		Logger.info('second');

		expect(listener).toHaveBeenCalledExactlyOnceWith(
			expect.objectContaining({ type: LoggerType.info, args: ['first'] })
		);
		expect(debugSpy).not.toHaveBeenCalled();
		expect(infoSpy).toHaveBeenCalledTimes(2);
	});

	it.each([false, true])('supports repeated unsubscribe with once=%s', once => {
		const listener = vi.fn();
		const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
		const unsubscribe = Logger.onLog(listener, once);

		unsubscribe();
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

	it('invokes a once-listener only once when it logs recursively', () => {
		const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
		const listener = vi.fn(() => {
			if (listener.mock.calls.length === 1) Logger.info('nested');
		});
		Logger.onLog(listener, true);

		Logger.info('outer');

		expect(listener).toHaveBeenCalledOnce();
		expect(consoleSpy).toHaveBeenNthCalledWith(1, 'nested');
		expect(consoleSpy).toHaveBeenNthCalledWith(2, 'outer');
	});

	it('removes a throwing once-listener and continues notifying later listeners', () => {
		const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		const listener = vi.fn(() => {
			throw new Error('listener failed');
		});
		const laterListener = vi.fn();
		Logger.onLog(listener, true);
		Logger.onLog(laterListener);

		expect(() => Logger.error('first')).not.toThrow();
		Logger.error('second');

		expect(listener).toHaveBeenCalledOnce();
		expect(laterListener).toHaveBeenCalledTimes(2);
		expect(consoleSpy).toHaveBeenNthCalledWith(1, 'first');
		expect(consoleSpy).toHaveBeenNthCalledWith(2, 'second');
	});

	it('lets a once-listener suppress only its first console call', () => {
		const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
		Logger.onLog(() => false, true);

		Logger.info('hidden');
		Logger.info('visible');

		expect(consoleSpy).toHaveBeenCalledExactlyOnceWith('visible');
	});

	it('clears regular and once-listeners without disabling console output', () => {
		const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
		const listener = vi.fn();
		const onceListener = vi.fn();
		Logger.onLog(listener);
		Logger.onLog(onceListener, true);

		Logger.clearListeners();
		Logger.info('visible');

		expect(listener).not.toHaveBeenCalled();
		expect(onceListener).not.toHaveBeenCalled();
		expect(consoleSpy).toHaveBeenCalledExactlyOnceWith('visible');
	});

	it('notifies listeners added during a log call of the same message', () => {
		vi.spyOn(console, 'info').mockImplementation(() => {});
		const received: string[] = [];
		const laterListener = () => {
			received.push('later');
		};
		Logger.onLog(() => {
			received.push('first');
			Logger.onLog(laterListener);
		});

		Logger.info('first message');
		expect(received).toEqual(['first', 'later']);

		Logger.info('second message');
		expect(received).toEqual(['first', 'later', 'first', 'later']);
	});

	it('skips remaining listeners when cleared during a log call', () => {
		const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
		const laterListener = vi.fn();
		Logger.onLog(() => Logger.clearListeners());
		Logger.onLog(laterListener);

		Logger.info('first');
		Logger.info('second');

		expect(laterListener).not.toHaveBeenCalled();
		expect(consoleSpy).toHaveBeenCalledTimes(2);
	});

	it('skips a listener unsubscribed before its turn', () => {
		const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
		const laterListener = vi.fn();
		Logger.onLog(() => unsubscribe());
		const unsubscribe = Logger.onLog(laterListener);

		Logger.info('visible');

		expect(laterListener).not.toHaveBeenCalled();
		expect(consoleSpy).toHaveBeenCalledExactlyOnceWith('visible');
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

	it.each([false, true])('preserves listeners while disabled with once=%s', once => {
		const listener = vi.fn();
		const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		Logger.onLog(listener, once);
		Logger.setEnabled(false);

		Logger.warn('hidden');

		expect(listener).not.toHaveBeenCalled();
		expect(consoleSpy).not.toHaveBeenCalled();

		Logger.setEnabled(true);
		Logger.warn('visible');

		expect(listener).toHaveBeenCalledOnce();
		expect(listener).toHaveBeenCalledWith(expect.objectContaining({ args: ['visible'] }));
		expect(consoleSpy).toHaveBeenCalledExactlyOnceWith('visible');
	});

	it('continues logging when a listener throws', () => {
		const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		Logger.onLog(() => {
			throw new Error('listener failed');
		});
		const laterListener = vi.fn();
		Logger.onLog(laterListener);

		expect(() => Logger.error('visible')).not.toThrow();
		expect(laterListener).toHaveBeenCalledOnce();
		expect(consoleSpy).toHaveBeenCalledWith('visible');
	});
});
