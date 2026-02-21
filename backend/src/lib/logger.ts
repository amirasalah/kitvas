/**
 * Structured Logger
 *
 * Lightweight logger that outputs JSON in production for machine parsing
 * and pretty-prints in development for readability.
 */

const isProduction = process.env.ENVIRONMENT === 'production';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  level: LogLevel;
  msg: string;
  [key: string]: unknown;
}

function formatLog(entry: LogEntry): string {
  if (isProduction) {
    return JSON.stringify({ ...entry, ts: new Date().toISOString() });
  }
  // Development: human-readable format
  const { level, msg, ...extra } = entry;
  const prefix = { info: 'ℹ', warn: '⚠️', error: '❌', debug: '🔍' }[level];
  const extraStr = Object.keys(extra).length > 0 ? ` ${JSON.stringify(extra)}` : '';
  return `${prefix} ${msg}${extraStr}`;
}

function log(level: LogLevel, msg: string, extra?: Record<string, unknown>): void {
  const entry: LogEntry = { level, msg, ...extra };
  const formatted = formatLog(entry);

  if (level === 'error') {
    console.error(formatted);
  } else if (level === 'warn') {
    console.warn(formatted);
  } else {
    console.log(formatted);
  }
}

export const logger = {
  info: (msg: string, extra?: Record<string, unknown>) => log('info', msg, extra),
  warn: (msg: string, extra?: Record<string, unknown>) => log('warn', msg, extra),
  error: (msg: string, extra?: Record<string, unknown>) => log('error', msg, extra),
  debug: (msg: string, extra?: Record<string, unknown>) => {
    if (!isProduction) log('debug', msg, extra);
  },
};
