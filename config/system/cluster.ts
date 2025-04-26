import cluster from 'cluster';
import Logger from 'config/logger';
import * as os from 'os';

const logger = new Logger();
const numCPUs = os.cpus().length;

export default class ClusterConfig {
  async set(app: { listen: (arg0: string) => any }) {
    if (process.env.NODE_ENV !== 'development') {
      try {
        if (cluster.isPrimary) {
          logger.log(
            'cluster',
            'info',
            `Master ${process.pid} is running`,
            'cluster',
          );

          for (let i = 0; i < numCPUs; i++) {
            cluster.fork();
          }

          cluster.on(
            'exit',
            (worker: { process: { pid: any } }, code: any, signal: any) => {
              logger.log(
                'cluster',
                'warn',
                `Worker ${worker.process.pid} died with code: ${code}, and signal: ${signal}`,
                'cluster',
              );
              logger.log('cluster', 'info', 'Starting a new worker', 'cluster');
            },
          );
        } else {
          await app.listen(process.env.PORT);
          logger.log(
            'app',
            'info',
            `Server started on port ${process.env.PORT}`,
            'bootstrap',
          );
        }
      } catch (error) {
        logger.log(
          'cluster',
          'error',
          `Error in cluster setup: ${error.message}\n${error.stack}`,
          'cluster',
        );
      }
    } else {
      await app.listen(process.env.PORT);
      logger.log(
        'app',
        'info',
        `Server started on port ${process.env.PORT}`,
        'bootstrap',
      );
    }
  }
}
