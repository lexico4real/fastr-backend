import Logger from "config/logger";

const logger = new Logger();

export default class CorsConfig {
  async set(app: any) {
    if (process.env.NODE_ENV !== 'production') {
      await app.enableCors();
    } else {
      await app.enableCors({
        origin: process.env.ORIGIN,
      });
      logger.log(
        'app',
        'trace',
        `accepting request from ${process.env.ORIGIN}`,
        'server-request',
      );
    }
  }
}