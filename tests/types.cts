import { Logger, LoggerType } from '@oardi/ts-logger';
import type { LoggerListener, LoggerPayload } from '@oardi/ts-logger';

const listener: LoggerListener = payload => {
	const level: LoggerType = payload.type;
	const args: unknown[] = payload.args;
	const timestamp: string = payload.timestamp;
	void [level, args, timestamp];
	return false;
};
const unsubscribe: () => void = Logger.onLog(listener, true);
const payload: LoggerPayload = {
	type: LoggerType.info,
	args: ['message', 42, { enabled: true }],
	timestamp: '2026-11-19T00:00:00.000Z',
};
const levels: LoggerType[] = [
	LoggerType.log,
	LoggerType.info,
	LoggerType.warn,
	LoggerType.debug,
	LoggerType.error,
];
Logger.log(payload);
Logger.info();
Logger.warn('message', 42);
Logger.debug({ enabled: true });
Logger.error(new Error('message'));
Logger.setEnabled(false);
Logger.clearListeners();
unsubscribe();
void levels;

// @ts-expect-error Log levels must be members of LoggerType.
const invalidLevel: LoggerType = 'trace';
// @ts-expect-error Listeners can return only void or boolean.
const invalidListener: LoggerListener = () => 'cancel';
// @ts-expect-error The enabled flag must be a boolean.
Logger.setEnabled('false');
// @ts-expect-error Payload timestamps must be strings.
const invalidPayload: LoggerPayload = { type: LoggerType.log, args: [], timestamp: 42 };
// @ts-expect-error LoggerPayload has no runtime value.
void LoggerPayload;
// @ts-expect-error LoggerListener has no runtime value.
void LoggerListener;
void [invalidLevel, invalidListener, invalidPayload];
