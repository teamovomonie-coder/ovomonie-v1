type LogLevel = 'debug' | 'info' | 'warn' | 'error';

function log(level: LogLevel, message: unknown, ...meta: unknown[]) {
    const entry: Record<string, unknown> = {
        level,
        message,
        timestamp: new Date().toISOString(),
    };

    if (meta.length === 1) {
        entry.meta = meta[0];
    } else if (meta.length > 1) {
        entry.meta = meta;
    }

    const serialized = JSON.stringify(entry);
    if (level === 'error') {
        console.error(serialized);
    } else if (level === 'warn') {
        console.warn(serialized);
    } else {
        console.log(serialized);
    }
}

export const logger = {
    debug: (message: unknown, ...meta: unknown[]) => log('debug', message, ...meta),
    info: (message: unknown, ...meta: unknown[]) => log('info', message, ...meta),
    warn: (message: unknown, ...meta: unknown[]) => log('warn', message, ...meta),
    error: (message: unknown, ...meta: unknown[]) => log('error', message, ...meta),
};
