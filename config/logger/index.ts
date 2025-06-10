import * as log4js from 'log4js';

export default class Logger {
  log(
    logName: string,
    level?: string,
    message?: any,
    fileName?: string,
  ): any {
    log4js.configure({
      appenders: {
        [logName]: { type: 'file', filename: `logs/${fileName}.log` },
      },
      categories: {
        default: { appenders: [logName || level], level: `${level}` },
        [logName]: { appenders: [logName || level], level: `${level}` },
      },
    });

    const logger = log4js.getLogger(logName);
    logger.level = level;
    switch (level) {
      case 'error':
        return logger.error(message);
      case 'info':
        return logger.info(message);
      case 'warn':
        return logger.warn(message);
      case 'trace':
        return logger.trace(message);
      case 'fatal':
        return logger.fatal(message);
      default:
        return logger.debug(message);
    }
  }
}