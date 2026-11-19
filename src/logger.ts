import { LoggerType } from './logger-type.enum.js';
import type { LoggerListener, LoggerPayload } from './logger.types.js';

export class Logger {
	private static listeners: Set<LoggerListener> = new Set();
	private static enabled = true;
	private static levels: Set<LoggerType> = new Set(Object.values(LoggerType));

	public static log(...args: unknown[]): void {
		Logger.doLog(LoggerType.log, args);
	}

	public static info(...args: unknown[]): void {
		Logger.doLog(LoggerType.info, args);
	}

	public static warn(...args: unknown[]): void {
		Logger.doLog(LoggerType.warn, args);
	}

	public static debug(...args: unknown[]): void {
		Logger.doLog(LoggerType.debug, args);
	}

	public static error(...args: unknown[]): void {
		Logger.doLog(LoggerType.error, args);
	}

	public static clearListeners(): void {
		Logger.listeners.clear();
	}

	public static setEnabled(value: boolean): void {
		Logger.enabled = value;
	}

	public static setLevels(levels: readonly LoggerType[]): void {
		Logger.levels = new Set(levels);
	}

	private static doLog(level: LoggerType, args: unknown[]): void {
		if (!Logger.enabled || !Logger.levels.has(level)) return;

		const payload: LoggerPayload = {
			type: level,
			args,
			timestamp: new Date().toISOString(),
		};
		let logToConsole = true;

		for (const listener of Logger.listeners) {
			try {
				const res = listener(payload);
				if (res === false) {
					logToConsole = false;
				}
			} catch {
				// swallow listener errors so logging never breaks the app
			}
		}

		if (logToConsole) {
			(console as Console)[level].apply(console, args);
		}
	}

	public static onLog(listener: LoggerListener, once = false): () => void {
		if (once) {
			const wrapper: LoggerListener = payload => {
				// Remove first so nested logging cannot invoke this listener again.
				Logger.listeners.delete(wrapper);
				return listener(payload);
			};
			Logger.listeners.add(wrapper);
			return () => Logger.listeners.delete(wrapper);
		}

		Logger.listeners.add(listener);
		return () => Logger.listeners.delete(listener);
	}
}
