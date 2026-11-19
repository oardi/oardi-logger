import type { LoggerType } from './logger-type.enum.js';

export type LoggerPayload = {
	type: LoggerType;
	args: unknown[];
	timestamp: string;
};

export type LoggerListener = (payload: LoggerPayload) => void | boolean;
