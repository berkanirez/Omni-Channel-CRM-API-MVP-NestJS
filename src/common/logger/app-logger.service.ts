import { Injectable, LoggerService } from '@nestjs/common';
import { RequestContextService } from './request-context.service';

type LogLevel = 'log' | 'error' | 'warn' | 'debug' | 'verbose';

@Injectable()
export class AppLogger implements LoggerService {
  constructor(private readonly ctx: RequestContextService) {}

  private write(
    level: LogLevel,
    message: string,
    meta?: Record<string, unknown>,
  ) {
    const requestId = this.ctx.getRequestId();

    const payload = {
      timestamp: new Date().toISOString(),
      level,
      requestId: requestId ?? null,
      message,
      ...(meta ? { meta } : {}),
    };

    const line = JSON.stringify(payload);

    if (level === 'error') console.error(line);
    else if (level === 'warn') console.warn(line);
    else console.log(line);
  }

  log(message: string, ...optionalParams: any[]) {
    this.write('log', message, optionalParams?.[0]);
  }

  warn(message: string, ...optionalParams: any[]) {
    this.write('warn', message, optionalParams?.[0]);
  }

  error(message: string, ...optionalParams: any[]) {
    const meta =
      typeof optionalParams?.[0] === 'string'
        ? { stack: optionalParams[0] }
        : optionalParams?.[0];

    this.write('error', message, meta);
  }

  debug(message: string, ...optionalParams: any[]) {
    this.write('debug', message, optionalParams?.[0]);
  }

  verbose(message: string, ...optionalParams: any[]) {
    this.write('verbose', message, optionalParams?.[0]);
  }
}
