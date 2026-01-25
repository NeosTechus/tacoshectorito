import type { VercelRequest } from '@vercel/node';

type LogLevel = 'info' | 'warn' | 'error';

type LogMeta = Record<string, unknown>;

const baseLog = (level: LogLevel, message: string, meta?: LogMeta) => {
  const payload = {
    level,
    message,
    time: new Date().toISOString(),
    ...(meta ?? {}),
  };
  const output = JSON.stringify(payload);
  if (level === 'error') {
    console.error(output);
  } else {
    console.log(output);
  }
};

export const getRequestContext = (req: VercelRequest) => ({
  method: req.method,
  path: req.url,
  requestId:
    (req.headers['x-vercel-id'] as string | undefined) ||
    (req.headers['x-request-id'] as string | undefined) ||
    undefined,
});

export const logInfo = (message: string, meta?: LogMeta) => {
  baseLog('info', message, meta);
};

export const logWarn = (message: string, meta?: LogMeta) => {
  baseLog('warn', message, meta);
};

export const logError = (message: string, error?: unknown, meta?: LogMeta) => {
  const isError = error instanceof Error;
  const errorMeta: LogMeta = {
    errorMessage: isError ? error.message : String(error ?? ''),
    ...(process.env.NODE_ENV !== 'production' && isError && error.stack
      ? { errorStack: error.stack }
      : {}),
  };
  baseLog('error', message, { ...(meta ?? {}), ...errorMeta });
};
