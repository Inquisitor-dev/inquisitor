class Logger {
  private isDev = process.env.NODE_ENV !== 'production';

  debug(...args: unknown[]): void {
    if (this.isDev) {
      console.debug('[Inquisitor:DEBUG]', ...args);
    }
  }

  info(...args: unknown[]): void {
    if (this.isDev) {
      console.info('[Inquisitor:INFO]', ...args);
    }
  }

  warn(...args: unknown[]): void {
    console.warn('[Inquisitor:WARN]', ...args);
  }

  error(...args: unknown[]): void {
    console.error('[Inquisitor:ERROR]', ...args);
  }
}

export const logger = new Logger();
